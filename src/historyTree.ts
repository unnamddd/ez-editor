// Import the ImmutableTreeOrderedList from the previous example
import { ImmutableTreeOrderedList } from './immutableTreeOrderedList'

// Define the HistoryNode and HistoryGraph
export type HistoryNode<T> = {
  state: T
  next: HistoryNode<T> | null
  prev: HistoryNode<T> | null
}

export class HistoryGraph<T> {
  private currentNode: HistoryNode<T>

  constructor(initialState: T) {
    this.currentNode = {
      state: initialState,
      next: null,
      prev: null,
    }
  }

  // Get current state
  getCurrentState(): T {
    return this.currentNode.state
  }

  // Perform an action (adding a new state to the graph)
  performAction(newState: T): void {
    const newNode: HistoryNode<T> = {
      state: newState,
      next: null,
      prev: this.currentNode,
    }

    this.currentNode.next = newNode
    this.currentNode = newNode
  }

  // Undo (move cursor back to the previous node)
  undo(): T | undefined {
    if (this.currentNode.prev) {
      this.currentNode = this.currentNode.prev
      return this.currentNode.state
    }
    return undefined // No more undo steps
  }

  // Redo (move cursor forward to the next node)
  redo(): T | undefined {
    if (this.currentNode.next) {
      this.currentNode = this.currentNode.next
      return this.currentNode.state
    }
    return undefined // No more redo steps
  }

  // Go to a specific state in the history graph
  goToState(state: T): boolean {
    let node: HistoryNode<T> | null = this.currentNode
    while (node) {
      if (node.state === state) {
        this.currentNode = node
        return true // Successfully navigated to the state
      }
      node = node.prev
    }
    return false // State not found
  }
}

// Example: Using HistoryGraph with ImmutableTreeOrderedList
export function historyWithTreeExample() {
  // Create an initial immutable tree
  let tree = new ImmutableTreeOrderedList<number>()

  // Add some elements to the tree
  tree = tree.add(1)
  tree = tree.add(2)
  tree = tree.add(3)

  // Create a history graph for the tree
  const history = new HistoryGraph(tree)

  console.log('Initial state:')
  console.log([...history.getCurrentState()]) // Output: [3, 2, 1]

  // Perform some actions and track them in history
  tree = tree.add(4)
  history.performAction(tree)

  tree = tree.add(5)
  history.performAction(tree)

  console.log('State after adding elements:')
  console.log([...history.getCurrentState()]) // Output: [5, 4, 3, 2, 1]

  // Undo the last action
  history.undo()
  console.log('State after undo:')
  console.log([...history.getCurrentState()]) // Output: [4, 3, 2, 1]

  // Redo the last undone action
  history.redo()
  console.log('State after redo:')
  console.log([...history.getCurrentState()]) // Output: [5, 4, 3, 2, 1]

  // Remove an element from the tree and track it
  tree = tree.remove(0) // Remove the first element (5)
  history.performAction(tree)

  console.log('State after removing element:')
  console.log([...history.getCurrentState()]) // Output: [4, 3, 2, 1]

  // Undo the remove operation
  history.undo()
  console.log('State after undoing remove:')
  console.log([...history.getCurrentState()]) // Output: [5, 4, 3, 2, 1]
}
