// IMFS — In-Memory File System (Design Exercise)
//
// Design rationale:
//
// Flat Map<id, FSNode> registry:
//   addFile / addDir are 80% of calls and must be O(1). A flat map gives
//   constant-time node lookup and insertion regardless of tree depth.
//
// parentId on every node:
//   delete needs to unlink a node from its parent's children map. Storing
//   parentId avoids traversing the tree to find the parent — unlink is O(1).
//
// Directory.children as Map<id, FSNode> (not Array):
//   Removing a child by id from an array is O(n). A map makes it O(1),
//   which keeps delete proportional to subtree size k rather than tree width.
//
// Strategy pattern for printing:
//   Open/closed principle — adding a new format (e.g. YAML) requires only a
//   new Printer subclass and one registry entry; the core IMFS class is untouched.

export enum PrintType {
  DOS = 'DOS',
  JSON = 'JSON',
  XML = 'XML',
  HTML = 'HTML',
}

// ---------------------------------------------------------------------------
// Composite: FSNode, File, Directory
// ---------------------------------------------------------------------------

abstract class FSNode {
  constructor(
    readonly id: number,
    readonly name: string,
    public parentId: number,
  ) {}
}

class File extends FSNode {
  constructor(
    id: number,
    name: string,
    parentId: number,
    private readonly data: Buffer,
  ) {
    super(id, name, parentId)
  }

  getData(): Buffer {
    return this.data
  }
}

class Directory extends FSNode {
  private readonly children: Map<number, FSNode> = new Map()

  constructor(id: number, name: string, parentId: number) {
    super(id, name, parentId)
  }

  addChild(node: FSNode): void {
    this.children.set(node.id, node)
  }

  removeChild(id: number): void {
    this.children.delete(id)
  }

  getChildren(): ReadonlyMap<number, FSNode> {
    return this.children
  }
}

// Type guards — let TypeScript narrow FSNode to a concrete subclass without manual casting.
function isDir(node: FSNode): node is Directory {
  return node instanceof Directory
}

function isFile(node: FSNode): node is File {
  return node instanceof File
}

// ---------------------------------------------------------------------------
// Strategy: Printer and concrete implementations
// ---------------------------------------------------------------------------

interface IPrinter {
  print(root: Directory): string
}

abstract class Printer implements IPrinter {
  // Subclasses declare their indent character; the base class handles repetition.
  protected readonly indentChar: string = '  '

  protected indent(depth: number): string {
    return this.indentChar.repeat(depth)
  }

  abstract print(root: Directory): string
  protected abstract renderDirectory(dir: Directory, depth: number): string
  protected abstract renderFile(file: File, depth: number): string

  // Returns each child as a separate string so callers control joining and
  // can distinguish "no children" from "empty string output".
  protected renderChildren(dir: Directory, depth: number): string[] {
    return [...dir.getChildren().values()].map((child) =>
      isDir(child) ? this.renderDirectory(child, depth) : this.renderFile(child as File, depth),
    )
  }
}

class DOSPrinter extends Printer {
  protected override readonly indentChar = '\t'

  print(root: Directory): string {
    const children = this.renderChildren(root, 1)
    return children.length > 0 ? `\\\n${children.join('\n')}` : '\\'
  }

  protected renderDirectory(dir: Directory, depth: number): string {
    const header = `${this.indent(depth)}${dir.name}\\`
    const children = this.renderChildren(dir, depth + 1)
    return children.length > 0 ? `${header}\n${children.join('\n')}` : header
  }

  protected renderFile(file: File, depth: number): string {
    return `${this.indent(depth)}${file.name}`
  }
}

class JSONPrinter implements IPrinter {
  print(root: Directory): string {
    return JSON.stringify(this.nodeToObject(root), null, 2)
  }

  private nodeToObject(node: FSNode): object {
    if (isDir(node)) {
      const children = [...node.getChildren().values()].map((child) => this.nodeToObject(child))
      return { id: node.id, name: node.name, type: 'directory', children }
    }
    if (isFile(node)) {
      return { id: node.id, name: node.name, type: 'file', size: node.getData().length }
    }
    throw new Error(`Unknown node type for id ${node.id}`)
  }
}

class XMLPrinter extends Printer {
  print(root: Directory): string {
    return `<?xml version="1.0" encoding="UTF-8"?>\n${this.renderDirectory(root, 0)}`
  }

  protected renderDirectory(dir: Directory, depth: number): string {
    const ind = this.indent(depth)
    const children = this.renderChildren(dir, depth + 1)
    const inner = children.length > 0 ? `\n${children.join('\n')}\n${ind}` : ''
    return `${ind}<directory id="${dir.id}" name="${dir.name}">${inner}</directory>`
  }

  protected renderFile(file: File, depth: number): string {
    return `${this.indent(depth)}<file id="${file.id}" name="${file.name}" size="${file.getData().length}" />`
  }
}

class HTMLPrinter extends Printer {
  print(root: Directory): string {
    return `<!DOCTYPE html>\n<html>\n<body>\n${this.renderDirectory(root, 0)}\n</body>\n</html>`
  }

  protected renderDirectory(dir: Directory, depth: number): string {
    const ind = this.indent(depth)
    const children = this.renderChildren(dir, depth + 1)
    const inner = children.length > 0 ? `\n${children.join('\n')}\n${ind}` : ''
    return `${ind}<ul data-id="${dir.id}"><li><strong>${dir.name}/</strong>${inner}</li></ul>`
  }

  protected renderFile(file: File, depth: number): string {
    return `${this.indent(depth)}<li data-id="${file.id}">${file.name} (${file.getData().length}B)</li>`
  }
}

// ---------------------------------------------------------------------------
// IMFS — main class
// ---------------------------------------------------------------------------

const IMPLICIT_ROOT_ID = 0

export class IMFS {
  private readonly registry: Map<number, FSNode> = new Map()
  private readonly root: Directory = new Directory(IMPLICIT_ROOT_ID, '', IMPLICIT_ROOT_ID)

  private readonly printerRegistry: Map<PrintType, IPrinter> = new Map<PrintType, IPrinter>([
    [PrintType.DOS, new DOSPrinter()],
    [PrintType.JSON, new JSONPrinter()],
    [PrintType.XML, new XMLPrinter()],
    [PrintType.HTML, new HTMLPrinter()],
  ])

  private resolveParent(pid: number): Directory {
    if (pid === IMPLICIT_ROOT_ID) return this.root
    const parent = this.registry.get(pid)
    if (!parent || !isDir(parent)) throw new Error(`Parent id ${pid} is not a directory`)
    return parent
  }

  addFile(id: number, name: string, data: Buffer, pid: number): void {
    this.registerNode(new File(id, name, pid, data), pid)
  }

  addDir(id: number, name: string, pid: number): void {
    this.registerNode(new Directory(id, name, pid), pid)
  }

  private registerNode(node: FSNode, pid: number): void {
    const parent = this.resolveParent(pid)
    this.registry.set(node.id, node)
    parent.addChild(node)
  }

  delete(id: number): void {
    if (id === IMPLICIT_ROOT_ID) return
    const node = this.registry.get(id)
    if (!node) return

    // Deregister the subtree first, then unlink from parent (O(k), k = subtree size)
    this.deregisterSubtree(node)
    this.resolveParent(node.parentId).removeChild(id)
  }

  private deregisterSubtree(node: FSNode): void {
    this.registry.delete(node.id)
    if (isDir(node)) {
      for (const child of node.getChildren().values()) {
        this.deregisterSubtree(child)
      }
    }
  }

  print(type: PrintType): string {
    const printer = this.printerRegistry.get(type)
    if (!printer) throw new Error(`Unknown print type: ${type}`)
    return printer.print(this.root)
  }
}

// ---------------------------------------------------------------------------
// Demo
// ---------------------------------------------------------------------------

const fs = new IMFS()

const data11 = Buffer.from('contents of File1')
const data12 = Buffer.from('contents of File2')
const data2 = Buffer.from('contents of File3')
const data3 = Buffer.from('contents of File4')
const data41 = Buffer.from('contents of File5')

fs.addDir(1, 'DirA', 0)
fs.addFile(11, 'File1', data11, 1)
fs.addFile(12, 'File2', data12, 1)
fs.addDir(13, 'DirC', 1)
fs.addFile(2, 'File3', data2, 0)
fs.addFile(3, 'File4', data3, 0)
fs.addDir(4, 'DirD', 0)
fs.addFile(41, 'File5', data41, 4)

console.log('=== DOS ===')
console.log(fs.print(PrintType.DOS))

console.log('\n=== JSON ===')
console.log(fs.print(PrintType.JSON))

console.log('\n=== XML ===')
console.log(fs.print(PrintType.XML))

console.log('\n=== HTML ===')
console.log(fs.print(PrintType.HTML))

console.log('\n=== Delete DirA (id 1) then DOS ===')
fs.delete(1)
console.log(fs.print(PrintType.DOS))
