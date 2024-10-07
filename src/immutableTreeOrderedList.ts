class TreeNode<T> {
  constructor(
    public readonly value: T,
    public readonly left: TreeNode<T> | null = null,
    public readonly right: TreeNode<T> | null = null
  ) {}
}

export class ImmutableTreeOrderedList<T> {
  private readonly root: TreeNode<T> | null;
  private readonly length: number;

  constructor(root: TreeNode<T> | null = null, length: number = 0) {
    this.root = root;
    this.length = length;
  }

  // Add a new element by creating a new root node
  add(element: T): ImmutableTreeOrderedList<T> {
    const newNode = new TreeNode(element, this.root);
    return new ImmutableTreeOrderedList(newNode, this.length + 1);
  }

  // Set (replace) the value at a specific index while preserving immutability
  set(index: number, value: T): ImmutableTreeOrderedList<T> {
    if (index < 0 || index >= this.length) {
      throw new Error('Index out of bounds');
    }
    const newRoot = this.rebuildTreeWithNewValue(this.root, index, value, this.length);
    return new ImmutableTreeOrderedList(newRoot, this.length);
  }

  private rebuildTreeWithNewValue(
    node: TreeNode<T> | null,
    index: number,
    value: T,
    size: number
  ): TreeNode<T> | null {
    if (!node) return null;
    const mid = Math.floor(size / 2);
    if (index < mid) {
      return new TreeNode(node.value, this.rebuildTreeWithNewValue(node.left, index, value, mid), node.right);
    } else if (index > mid) {
      return new TreeNode(node.value, node.left, this.rebuildTreeWithNewValue(node.right, index - mid - 1, value, size - mid - 1));
    } else {
      return new TreeNode(value, node.left, node.right); // Replace the value at the index
    }
  }

  // Remove an element by rebuilding the tree while preserving immutability
  remove(index: number): ImmutableTreeOrderedList<T> {
    if (index < 0 || index >= this.length) {
      throw new Error("Index out of bounds");
    }
    const newRoot = this.rebuildTreeWithoutIndex(this.root, index, this.length);
    return new ImmutableTreeOrderedList(newRoot, this.length - 1);
  }

  // Helper function to rebuild the tree without the node at the given index
  private rebuildTreeWithoutIndex(
    node: TreeNode<T> | null,
    index: number,
    size: number
  ): TreeNode<T> | null {
    if (!node) return null;
    const mid = Math.floor(size / 2);

    if (index < mid) {
      return new TreeNode(node.value, this.rebuildTreeWithoutIndex(node.left, index, mid), node.right);
    } else if (index > mid) {
      return new TreeNode(node.value, node.left, this.rebuildTreeWithoutIndex(node.right, index - mid - 1, size - mid - 1));
    } else {
      return this.mergeTrees(node.left, node.right);  // When the node to remove is found, merge its subtrees
    }
  }

  // Merge two subtrees into one while preserving immutability
  private mergeTrees(left: TreeNode<T> | null, right: TreeNode<T> | null): TreeNode<T> | null {
    if (!left) return right;
    if (!right) return left;

    // Find the rightmost node of the left subtree
    let rightmost = left;
    let parent: TreeNode<T> | null = null;

    while (rightmost.right !== null) {
      parent = rightmost;
      rightmost = rightmost.right;
    }

    // Reattach left subtree minus the rightmost node
    if (parent) {
      parent = new TreeNode(parent.value, parent.left, rightmost.left);  // Create a new node to replace the parent
    } else {
      left = rightmost.left;  // If no parent, the rightmost node was the root of the left subtree
    }

    // Create a new root node linking the left and right subtrees
    return new TreeNode(rightmost.value, left, right);
  }

  // Retrieve the value at a specific index
  get(index: number): T | undefined {
    if (index < 0 || index >= this.length) {
      return undefined;
    }

    return this.getNodeAt(this.root, index, this.length);
  }

  // Helper to get node at a specific index
  private getNodeAt(node: TreeNode<T> | null, index: number, size: number): T | undefined {
    if (!node) return undefined;
    const mid = Math.floor(size / 2);
    if (index < mid) return this.getNodeAt(node.left, index, mid);
    if (index > mid) return this.getNodeAt(node.right, index - mid - 1, size - mid - 1);
    return node.value;
  }

  get size(): number {
    return this.length;
  }

  // Iterator implementation to allow for...of loops
  [Symbol.iterator](): Iterator<T> {
    const stack: TreeNode<T>[] = [];
    let current: TreeNode<T> | null = this.root;

    return {
      next(): IteratorResult<T> {
        while (current || stack.length > 0) {
          if (current) {
            stack.push(current);
            current = current.left;
          } else {
            const node = stack.pop()!;
            current = node.right;
            return { value: node.value, done: false };
          }
        }
        return { value: undefined, done: true };
      },
    };
  }
}
