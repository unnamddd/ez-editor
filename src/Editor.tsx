import type { ChangeEvent, RefObject } from 'react'
import React, { useEffect, useReducer, useRef, useState } from 'react'

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

  const handleInput = (e: any, blockId: any): void => {
    // Update the state without causing re-renders of the contentEditable div
    const text = e.currentTarget.value

    updateBlockContent(blockId, text)

    // Check for trigger pattern
    const selection = window.getSelection()
    if (!selection)
      return
    const range = selection.getRangeAt(0)
    const textBeforeCaret = text.substring(0, range.startOffset)

    if (textBeforeCaret.endsWith('/')) {
      const rect = range.getBoundingClientRect()
      setMenuPosition({ x: rect.left, y: rect.bottom })
      setShowMenu(true)
      setCurrentBlockId(blockId)
    }
    else {
      setShowMenu(false)
    }
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
        focused === index
          ? (
              <textarea
                autoFocus
                key={block.id}
                className="ez-bg-transparent ez-outline-none ez-border-none ez-w-full ez-box-border ez-resize-none ez-overflow-hidden"
                style={{
                  background: 'transparent',
                  outline: 'none',
                  border: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                  resize: 'none',
                  overflow: 'hidden',
                }}
                rows={1}
                value={block.content}
                onChange={e => handleInput(e, block.id)}
                onKeyDown={e => handleKeyDown(e, block.id, index)}
                ref={el => (blockRefs.current[block.id] = el as any)}
              />
            )
          : (
              <div
                key={block.id}
                ref={el => (blockRefs.current[block.id] = el as any)}
                tabIndex={-1}
                onFocus={() => setFocused(index)}
                style={{ minHeight: '20px', padding: '5px' }}
              >
                {block.content}
              </div>
            )
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
    <div style={{ position: 'relative', border: '1px solid #ccc', padding: '10px' }}>
      {blocks.map((block: any, index: any) => renderBlock(block, index))}
      {showMenu && (
        <ul
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
      <div style={{ marginTop: '10px' }}>
        <button onClick={handleUndo} type="button" disabled={state.past.length === 0}>
          Undo
        </button>
        <button onClick={handleRedo} type="button" disabled={state.future.length === 0}>
          Redo
        </button>
      </div>
    </div>
  )
};

export default Editor
