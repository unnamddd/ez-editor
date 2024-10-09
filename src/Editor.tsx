import type { ChangeEvent, RefObject } from 'react'
import type { HistoryGraph, historyWithTreeExample } from './historyTree'
import type { ImmutableTreeOrderedList } from './immutableTreeOrderedList'
import React, { useEffect, useReducer, useRef, useState } from 'react'
import DragIcon from './DragIcon'

// Define action types as string constants
const ADD_ELEMENT = 'ADD_ELEMENT'
const REMOVE_ELEMENT = 'REMOVE_ELEMENT'
const UNDO = 'UNDO'
const REDO = 'REDO'

// Action type definitions
type Action<T> =
  | { type: typeof ADD_ELEMENT, payload: T }
  | { type: typeof REMOVE_ELEMENT, payload: number }
  | { type: typeof UNDO }
  | { type: typeof REDO }

// Reducer state type
interface ReducerState<T> {
  historyGraph: HistoryGraph<ImmutableTreeOrderedList<T>>
}


const initialEditorState: ReducerState<string> = {
  historyGraph: initialHistory,
};

// Reducer function with typed action and state
function editorReducer<T>(state: ReducerState<T>, action: Action<T>): ReducerState<T> {
  const { historyGraph } = state
  const currentTree = historyGraph.getCurrentState()

  const actions = {
    [ADD_ELEMENT]: () => {
      const newTreeAfterAdd = currentTree.add(action.payload)
      historyGraph.performAction(newTreeAfterAdd)
      return { historyGraph }
    },
    [REMOVE_ELEMENT]: () => {
      const newTreeAfterRemove = currentTree.remove(action.payload)
      historyGraph.performAction(newTreeAfterRemove)
      return { historyGraph }
    },
    [UNDO]: () => {
      historyGraph.undo()
      return { historyGraph }
    },
    [REDO]: () => {
      historyGraph.redo()
      return { historyGraph }
    },
  }
  return action.type in actions ? actions[action.type]() : state
}



function Editor(): React.ReactNode {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState)
  const [focused, setFocused] = useState(null)
  const { present: blocks } = state

  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [currentBlockId, setCurrentBlockId] = useState(null)

  const caretPosition = useRef<number>(0)

  const blockRefs = useRef<Record<string, HTMLDivElement | HTMLInputElement>>({})
  const [pendingFocusBlockId, setPendingFocusBlockId] = useState(null)

  // Collaboration: Simulated external updates (placeholder for real collaboration logic)
  const [
    externalUpdates,
    setExternalUpdates,
  ] = useState(null)

  const handleUndo = (): void => {
    dispatch({ type: ACTION_TYPES.UNDO })
    // Collaboration: Handle undo in collaborative context if needed
  }

  const handleRedo = (): void => {
    dispatch({ type: ACTION_TYPES.REDO })
    // Collaboration: Handle redo in collaborative context if needed
  }

  // Placeholder function to simulate sending updates to collaborators
  const sendCollaborativeUpdate = (updatedBlocks: any): void => {
    // In a real implementation, this would send the updatedBlocks to a server
    // or use a WebSocket to broadcast to other connected clients
    console.log('Sending collaborative update:', updatedBlocks)
  }

  useEffect(() => {
    if (pendingFocusBlockId !== null) {
      const newBlockRef = blockRefs.current[pendingFocusBlockId]
      if (newBlockRef) {
        newBlockRef.focus()
        // Place caret at the start (or end) if needed
        const range = document.createRange()
        range.selectNodeContents(newBlockRef)
        range.collapse(true) // Set to false to place at the end
        const sel = window.getSelection()
        if (sel) {
          sel.removeAllRanges()
          sel.addRange(range)
        }
      }
      setPendingFocusBlockId(null)
    }
  }, [pendingFocusBlockId])

  const updateBlockContent = (blockId: any, content: any, element: HTMLElement): void => {
    if (element.clientWidth < element.scrollWidth) {
      // split logic goes here
      console.log('tweakin')
    }
    const updatedBlocks = blocks.map((block: any) =>
      block.id === blockId
        ? {
            ...block,
            content:
            (block.content?.slice(0, caretPosition.current) ?? '')
            + (content ?? '')
            + (block.content?.slice(caretPosition.current) ?? ''),
          }
        : block,
    )
    dispatch({ type: ACTION_TYPES.UPDATE_BLOCKS, blocks: updatedBlocks })

    // Collaboration: Send updated content to collaborators
    sendCollaborativeUpdate(updatedBlocks)
  }

  const getCaretPosition = (): number => {
    const selection = window.getSelection()
    return selection?.anchorOffset ?? 0
  }

  const handleEditableClick = (): void => {
    caretPosition.current = getCaretPosition()
  }

  const setCaretPosition = (editableDiv: any, position: any): void => {
    const range = document.createRange()
    const selection = window.getSelection()
    if (!selection)
      return

    // Get the text node inside the div
    const textNode = editableDiv.firstChild
    if (!textNode)
      return

    // Ensure position is within bounds of the text node
    const validPosition = Math.min(position, textNode?.length ?? 0)

    // Set caret at the new position
    range.setStart(textNode, validPosition)
    range.setEnd(textNode, validPosition)

    // Clear any previous selections and apply the new range
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const handleLineSplit = (element: HTMLElement) => {

  }

  const handleInput = (e: any, blockId: any): void => {
    const text = e.data
    const element = e.currentTarget

    e.preventDefault()

    if (!e.data)
      return

    if (!window.getSelection()?.isCollapsed) {
      deleteSelection(blockId, element, text)
    }
    else {
      updateBlockContent(blockId, text, element)
    }

    caretPosition.current += 1
    queueMicrotask(() => {
      setCaretPosition(element, caretPosition.current)
    })

    // Check for trigger pattern
    // const newRange = document.createRange()
    // newRange.setStart(e.currentTarget.firstChild, text.length - 1)
    // newRange.collapse(true)
    // const selection = window.getSelection()
    // if (!selection)
    //  return
    // selection.removeAllRanges()
    // selection.addRange(newRange)
    // const range = selection.getRangeAt(0)
    // const textBeforeCaret = text.substring(0, range.startOffset)
    //
    // if (textBeforeCaret.endsWith('/')) {
    //  const rect = range.getBoundingClientRect()
    //  setMenuPosition({ x: rect.left, y: rect.bottom })
    //  setShowMenu(true)
    //  setCurrentBlockId(blockId)
    // }
    // else {
    //  setShowMenu(false)
    // }
  }

  const insertComponent = (componentType: any): void => {
    const updatedBlocks = blocks.map((block: any) => {
      if (block.id === currentBlockId) {
        // Replace the block with the component
        return { id: Date.now(), type: 'component', componentType }
      }
      return block
    })
    dispatch({ type: ACTION_TYPES.UPDATE_BLOCKS, blocks: updatedBlocks })
    setShowMenu(false)

    // Collaboration: Send updated content to collaborators
    sendCollaborativeUpdate(updatedBlocks)
  }

  const addNewBlock = (index: any): void => {
    const newBlock = { id: Date.now(), type: 'text' }
    const updatedBlocks = [...blocks]
    updatedBlocks.splice(index + 1, 0, newBlock)
    dispatch({ type: ACTION_TYPES.UPDATE_BLOCKS, blocks: updatedBlocks })

    setPendingFocusBlockId(newBlock.id as any)

    // Collaboration: Send updated content to collaborators
    sendCollaborativeUpdate(updatedBlocks)
  }

  const deleteBlock = (blockId: any): void => {
    const blockIndex = blocks.findIndex((block: any) => block.id === blockId)
    const updatedBlocks = blocks.filter((block: any) => block.id !== blockId)
    dispatch({ type: ACTION_TYPES.UPDATE_BLOCKS, blocks: updatedBlocks })

    if (blocks.length > 0) {
      const blockToFocus = blocks[blockIndex - 1]
      const blockElement = document.getElementById(blockToFocus.id)

      blockElement?.focus()
      caretPosition.current = blockToFocus.content?.length ?? 0
      queueMicrotask(() => {
        setCaretPosition(blockElement, caretPosition.current)
      })
    }

    // Collaboration: Send updated content to collaborators
    sendCollaborativeUpdate(updatedBlocks)
  }

  const deleteRightToCaret = (blockId: any): void => {
    const currentBlock = blocks.find((block: any) => block.id === blockId)
    const updatedBlocks = blocks.filter((block: any) => block.id !== blockId)
    if (!currentBlock.content)
      return

    dispatch({
      type: ACTION_TYPES.UPDATE_BLOCKS,
      blocks: [
        ...updatedBlocks,
        {
          ...currentBlock,
          content:
            currentBlock.content.slice(0, caretPosition.current)
            + (currentBlock.content.slice(caretPosition.current + 1) ?? ''),
        },
      ],
    })
  }

  const deleteLeftToCaret = (blockId: any): void => {
    const currentBlock = blocks.find((block: any) => block.id === blockId)
    const updatedBlocks = blocks.filter((block: any) => block.id !== blockId)
    if (!currentBlock.content)
      return

    dispatch({
      type: ACTION_TYPES.UPDATE_BLOCKS,
      blocks: [
        ...updatedBlocks,
        {
          ...currentBlock,
          content:
            currentBlock.content.slice(0, caretPosition.current - 1)
            + (currentBlock.content.slice(caretPosition.current) ?? ''),
        },
      ],
    })
    caretPosition.current -= 1
  }

  const deleteSelection = (blockId: any, element: HTMLElement, replaceWith?: string): void => {
    const selection = window.getSelection()
    const currentBlock = blocks.find((block: any) => block.id === blockId)
    const updatedBlocks = blocks.filter((block: any) => block.id !== blockId)

    if (selection?.containsNode(element, true)) {
      for (let rangeIndex = 0; rangeIndex < selection.rangeCount; rangeIndex++) {
        const range = selection.getRangeAt(rangeIndex)
        let start, end
        if (element.compareDocumentPosition(range.startContainer) & Node.DOCUMENT_POSITION_CONTAINED_BY) {
          start = range.startOffset
        }
        if (element.compareDocumentPosition(range.endContainer) & Node.DOCUMENT_POSITION_CONTAINED_BY) {
          end = range.endOffset
        }

        if (start && end) {
          dispatch({
            type: ACTION_TYPES.UPDATE_BLOCKS,
            blocks: [
              ...updatedBlocks,
              {
                ...currentBlock,
                content:
                  currentBlock.content.slice(0, start)
                  + (replaceWith ?? '')
                  + (currentBlock.content.slice(end) ?? ''),
              },
            ],
          })
          caretPosition.current = start
        }
        else if (start && !end) {
          console.log(start, 'no-end')
          dispatch({
            type: ACTION_TYPES.UPDATE_BLOCKS,
            blocks: [
              ...updatedBlocks,
              {
                ...currentBlock,
                content:
                  currentBlock.content.slice(0, start) + (replaceWith ?? ''),
              },
            ],
          })
          caretPosition.current = start
        }
        else if (!start && end) {
          console.log(end, 'no-start')
          dispatch({
            type: ACTION_TYPES.UPDATE_BLOCKS,
            blocks: [
              ...updatedBlocks,
              {
                ...currentBlock,
                content:
                  (replaceWith ?? '')
                  + currentBlock.content.slice(end) ?? '',
              },
            ],
          })
          caretPosition.current = 0
        }
      }
    }
  }

  const addNewLine = (blockId: any): void => {

  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, blockId: any, index: any): void => {
    const element = e.currentTarget
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!e.shiftKey) {
        addNewBlock(index)
      }
      else {
        addNewLine(blockId)
      }
      caretPosition.current = 0
    }
    else if (e.key === 'Delete') {
      e.preventDefault()
      const content = e.currentTarget.textContent
      if (content !== '') {
        const selection = window.getSelection()
        if (selection?.isCollapsed) {
          deleteRightToCaret(blockId)
        }
        else {
          deleteSelection(blockId, element)
        }
      }

      queueMicrotask(() => {
        setCaretPosition(element, caretPosition.current)
      })
    }
    else if (e.key === 'Backspace') {
      e.preventDefault()
      const content = e.currentTarget.textContent
      if (content === '' && blocks.length > 1) {
        deleteBlock(blockId)
      }
      else {
        const selection = window.getSelection()
        if (selection?.isCollapsed) {
          deleteLeftToCaret(blockId)
        }
        else {
          deleteSelection(blockId, element)
        }
      }

      queueMicrotask(() => {
        setCaretPosition(element, caretPosition.current)
      })
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
    }
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
    }
    else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (e.shiftKey) {

      }
      else {
        caretPosition.current = Math.max(caretPosition.current - 1, 0)
        setCaretPosition(element, caretPosition.current)
      }
    }
    else if (e.key === 'ArrowRight') {
      e.preventDefault()
      if (e.shiftKey) {

      }
      else {
        caretPosition.current = caretPosition.current + 1
        setCaretPosition(element, caretPosition.current)
      }
    }
    else if (e.ctrlKey && e.key === 'z') {
      e.preventDefault()
      handleUndo()
    }
    else if (e.ctrlKey && e.key === 'y') {
      e.preventDefault()
      handleRedo()
    }
  }

  // Placeholder function to simulate receiving updates from collaborators
  useEffect(() => {
    if (externalUpdates) {
      dispatch({ type: ACTION_TYPES.UPDATE_BLOCKS, blocks: externalUpdates })
    }
  }, [externalUpdates])

  const handleCopy = (e) => {
    e.preventDefault()
  }

  const handlePaste = (e) => {
    e.preventDefault()
  }

  const handleCut = (e) => {
    e.preventDefault()
  }

  const renderBlock = (block: any, index: any): React.ReactNode => {
    if (block.type === 'text') {
      console.log(block.content)
      return (
        <div
          key={block.id}
          className="
            ez-overflow-hidden
            before:ez--ml-1 before:ez-absolute before:ez-rounded-md focus-within:before:ez-block focus-within:before:ez-bg-cyan-200 before:ez-h-full before:ez-w-1
            ez-relative ez-flex ez-gap-2 ez-w-full ez-text-xl ez-h-max ez-items-center
          "
        >
          <button type="button">
            <DragIcon width={32} height={32} className="" />
          </button>
          <div className="ez-w-full ez-overflow-hidden">
            <div
              ref={el => (blockRefs.current[block.id] = el as any)}
              id={block.id}
              className="
                    ez-bg-transparent ez-outline-none ez-border-none
                    ez-whitespace-pre-wrap ez-w-full ez-h-full
                    ez-text-start ez-cursor-text ez-min-w-0 ez-flex-grow
                    ez-text-nowrap
                  "
              tabIndex={1}
              contentEditable
              suppressContentEditableWarning
              onBeforeInput={e => handleInput(e, block.id)}
              onClick={handleEditableClick}
              onKeyDown={e => handleKeyDown(e, block.id, index)}
              onFocus={() => setFocused(index)}
              onCopy={handleCopy}
              onPaste={handlePaste}
              onCut={handleCut}
            >
              {block.content}
            </div>
          </div>
        </div>
      )
    }
    else if (block.type === 'component') {
      const Component = (componentMapping as any)[block.componentType]
      return (
        <div key={block.id} style={{ padding: '5px' }}>
          {Component ? <Component /> : `[Unknown component: ${block.componentType}]`}
        </div>
      )
    }
    return null
  }

  return (
    <div
      className="ez-h-full ez-flex ez-flex-col ez-gap-2 ez-rounded-xl ez-relative ez-border-solid ez-border-zinc-200 ez-border-2 ez-p-4 ez-overflow-auto"
    >
      {blocks.map((block: any, index: any) => renderBlock(block, index))}
      {showMenu && (
        <ul
          className="ez-flex ez-gap-2"
          style={{
            position: 'absolute',
            top: menuPosition.y + window.scrollY,
            left: menuPosition.x + window.scrollX,
            listStyle: 'none',
            padding: '5px',
            margin: 0,
            backgroundColor: '#fff',
            border: '1px solid #ccc',
          }}
        >
          <li onClick={() => insertComponent('Component1')}>Insert Chart</li>
          <li onClick={() => insertComponent('Component2')}>Insert Image</li>
        </ul>
      )}
      <div className="ez-flex ez-gap-4">
        <button
          onClick={handleUndo}
          type="button"
          className="ez-text-black ez-bg-zinc-100 disabled:ez-bg-zinc-200 disabled:ez-text-zinc-400 ez-px-4 ez-py-1 ez-cursor-pointer ez-rounded-lg"
          disabled={state.past.length === 0}
        >
          Undo
        </button>
        <button
          className="ez-text-black ez-bg-zinc-100 disabled:ez-bg-zinc-200 disabled:ez-text-zinc-400 ez-px-4 ez-py-1 ez-cursor-pointer ez-rounded-lg"
          onClick={handleRedo}
          type="button"
          disabled={state.future.length === 0}
        >
          Redo
        </button>
      </div>

      <div id="toolbar" className="ez-fixed ez-left-0 ez-top-0 ez-p-2 ez-flex ez-gap-2 [&_*]:ez-p-2">
        <button>1</button>
        <button>2</button>
        <button>3</button>
      </div>
    </div>
  )
}

export default Editor
