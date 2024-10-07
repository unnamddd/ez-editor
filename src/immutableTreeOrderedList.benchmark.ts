// Import necessary modules
import { performance } from 'node:perf_hooks'
import { ImmutableTreeOrderedList } from './immutableTreeOrderedList' // Assuming the tree-based list is in this file

// Helper function to format memory usage
function formatMemoryUsage(memory: NodeJS.MemoryUsage) {
  const used = memory.heapUsed / 1024 / 1024
  return `${Math.round(used * 100) / 100} MB`
}

// Benchmarking function to test memory payload and operation time with 1000-10000 sets and gets
function benchmarkImmutableTreeOrderedList() {
  console.log('Benchmarking ImmutableTreeOrderedList with many set, get, and remove operations...')

  let list = new ImmutableTreeOrderedList<number>()

  // Initial memory usage
  console.log('Initial Memory Usage:', formatMemoryUsage(process.memoryUsage()))

  // Add 100,000 elements
  const addStartTime = performance.now()
  for (let i = 0; i < 100000; i++) {
    list = list.add(i)
  }
  const addEndTime = performance.now()
  const addOperationTime = (addEndTime - addStartTime).toFixed(2)
  console.log('Memory after adding 100,000 elements:', formatMemoryUsage(process.memoryUsage()))
  console.log(`Time taken to add 100,000 elements: ${addOperationTime} ms`)

  // Perform 10,000 set operations
  const setStartTime = performance.now()

  for (let i = 0; i < 10000; i++) {
    // Randomly pick indices to update
    const randomIndex = Math.floor(Math.random() * 100000)
    list = list.set(randomIndex, i) // Set the value to `i`
  }

  const setEndTime = performance.now()
  const setOperationTime = (setEndTime - setStartTime).toFixed(2)
  console.log('Memory after 10,000 set operations:', formatMemoryUsage(process.memoryUsage()))
  console.log(`Time taken to perform 10,000 set operations: ${setOperationTime} ms`)

  // Perform 10,000 get operations
  const getStartTime = performance.now()

  for (let i = 0; i < 10000; i++) {
    // Randomly pick indices to access
    const randomIndex = Math.floor(Math.random() * 100000)
    const value = list.get(randomIndex) // Get value at random index
  }

  const getEndTime = performance.now()
  const getOperationTime = (getEndTime - getStartTime).toFixed(2)
  console.log(`Time taken to perform 10,000 get operations: ${getOperationTime} ms`)

  // Perform 50,000 remove operations
  const removeStartTime = performance.now()
  for (let i = 0; i < 50000; i++) {
    list = list.remove(0) // Remove elements from the start
  }
  const removeEndTime = performance.now()
  const removeOperationTime = (removeEndTime - removeStartTime).toFixed(2)
  console.log('Memory after removing 50,000 elements:', formatMemoryUsage(process.memoryUsage()))
  console.log(`Time taken to remove 50,000 elements: ${removeOperationTime} ms`)

  // Final memory usage
  console.log('Final Memory Usage:', formatMemoryUsage(process.memoryUsage()))
}

// Execute the benchmark
benchmarkImmutableTreeOrderedList()
