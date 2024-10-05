import type { ChangeEvent, RefObject } from 'react'
import React, { useEffect, useReducer, useRef, useState } from 'react'
import DragIcon from './DragIcon'

// Example components that can be inserted
function CustomComponent1(): React.ReactNode {
  return <div style={{ background: '#e0f7fa' }}>📊 Chart Component</div>
}
function CustomComponent2(): React.ReactNode {
  return <div style={{ background: '#fce4ec' }}>📷 Image Component</div>
}

const componentMapping = {
  Component1: CustomComponent1,
  Component2: CustomComponent2,
}

// Action Types for Reducer
const ACTION_TYPES = {
  UPDATE_BLOCKS: 'UPDATE_BLOCKS',
  UNDO: 'UNDO',
  REDO: 'REDO',
}

function actions({
  action,
  past,
  present,
  future,
  state,
}: any): any {
  return {
    [ACTION_TYPES.UPDATE_BLOCKS]: () => ({
      past: [...past, present],
      present: action.blocks,
      future: [],
    }),
    [ACTION_TYPES.UNDO]: () => {
      if (past.length === 0)
        return state
      const previous = past[past.length - 1]
      return {
        past: past.slice(0, past.length - 1),
        present: previous,
        future: [present, ...future],
      }
    },
    [ACTION_TYPES.REDO]: () => {
      if (future.length === 0)
        return state
      const next = future[0]
      return {
        past: [...past, present],
        present: next,
        future: future.slice(1),
      }
    },

  }
}

// Reducer Function for History Management
function editorReducer(state: any, action: any): any {
  const { past, present, future } = state
  return actions({
    action,
    past,
    present,
    future,
    state,
  })[action.type]() ?? state
}

const initialEditorState = {
  past: [],
  present: [{ id: Date.now(), type: 'text' }],
  future: [],
}

function Editor(): React.ReactNode {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState)
  const [focused, setFocused] = useState(null)
  const { present: blocks } = state

  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [currentBlockId, setCurrentBlockId] = useState(null)

  const caretPosition = useRef<number>(null!)

  const blockRefs = useRef<Record<string, HTMLDivElement | HTMLInputElement>>({})
  const [pendingFocusBlockId, setPendingFocusBlockId] = useState(null)

  // Collaboration: Simulated external updates (placeholder for real collaboration logic)
  const [
    externalUpdates,
    // setExternalUpdates
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

  const updateBlockContent = (blockId: any, content: any): void => {
    const updatedBlocks = blocks.map((block: any) =>
      block.id === blockId ? { ...block, content } : block,
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

    // Ensure position is within bounds of the text node
    const validPosition = Math.min(position, textNode.length)

    // Set caret at the new position
    range.setStart(textNode, validPosition)
    range.setEnd(textNode, validPosition)

    // Clear any previous selections and apply the new range
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const handleInput = (e: any, blockId: any): void => {
    // Update the state without causing re-renders of the contentEditable div

    const text = e.data
    const element = e.currentTarget
    e.preventDefault()

    updateBlockContent(blockId, text)
    console.dir(e.currentTarget?.firstChild)

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
    const updatedBlocks = blocks.filter((block: any) => block.id !== blockId)
    dispatch({ type: ACTION_TYPES.UPDATE_BLOCKS, blocks: updatedBlocks })

    // Collaboration: Send updated content to collaborators
    sendCollaborativeUpdate(updatedBlocks)
  }

  const handleKeyDown = (e: any, blockId: any, index: any): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addNewBlock(index)
    }
    else if (e.key === 'Backspace') {
      // Handle block deletion if content is empty
      // const block = blocks[index]
      const content = e.currentTarget.textContent
      if (content === '' && blocks.length > 1) {
        e.preventDefault()
        deleteBlock(blockId)
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

  const renderBlock = (block: any, index: any): React.ReactNode => {
    if (block.type === 'text') {
      return (
        <div
          key={block.id}
          className="
            before:ez--ml-1 before:ez-absolute before:ez-rounded-md focus-within:before:ez-block focus-within:before:ez-bg-cyan-200 before:ez-h-full before:ez-w-1
            ez-relative ez-flex ez-gap-2 ez-w-full ez-text-xl ez-h-max ez-items-center
          "
        >
          <button type="button">
            <DragIcon width={32} height={32} className="" />
          </button>
          {
            // focused === index
            // ? (
            //    <textarea
            //      autoFocus
            //      className="ez-bg-transparent ez-outline-none ez-border-none ez-w-full ez-box-border ez-resize-none ez-overflow-hidden"
            //      rows={1}
            //      value={block.content}
            //      onChange={e => handleInput(e, block.id)}
            //      onKeyDown={e => handleKeyDown(e, block.id, index)}
            //      ref={el => (blockRefs.current[block.id] = el as any)}
            //    />
            //  )
            // :
            (
              <div
                ref={el => (blockRefs.current[block.id] = el as any)}
                className="ez-bg-transparent ez-outline-none ez-border-none ez-whitespace-pre-wrap ez-w-full ez-h-full ez-text-start ez-cursor-text ez-min-w-0 ez-flex-grow ez-caret-transparent"
                tabIndex={0}
                contentEditable
                suppressContentEditableWarning
                onInput={e => handleInput(e, block.id)}
                onBeforeInput={e => handleInput(e, block.id)}
                onClick={handleEditableClick}
                onKeyDown={e => handleKeyDown(e, block.id, index)}
                onFocus={() => setFocused(index)}
              >
                {block.content}
              </div>
            )
          }
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

      <div id="toolbar" className='ez-fixed ez-left-0 ez-top-0 ez-p-2 ez-flex ez-gap-2 [&_*]:ez-p-2'>
        <button>1</button>
        <button>2</button>
        <button>3</button>
      </div>
    </div>
  )
};

export default Editor
