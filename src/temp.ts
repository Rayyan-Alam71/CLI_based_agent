// // src/temp.ts
// // This file demonstrates an approach for adding todo tracking to the agent for long-running tasks.
// // It shows how to integrate with the existing codebase without modifying core files directly.

// /**
//  * APPROACH FOR TODO TRACKING SYSTEM
//  *
//  * To implement todo tracking for preventing agent focus loss during complex tasks:
//  *
//  * 1. ADD TODO MANAGEMENT TOOLS:
//  *    - Add new tools in src/utils/tools.ts (todo_add, todo_list, todo_update, etc.)
//  *    - Implement corresponding functions in src/utils/command.ts
//  *    - These tools would interact with a todo storage system (JSON file)
//  *
//  * 2. ENHANCE SYSTEM PROMPT:
//  *    - Modify getRootSystemPrompt() in src/utils/prompt.ts to include instructions
//  *      about using the todo system for complex tasks
//  *    - Add guidance on breaking down tasks and tracking progress
//  *
//  * 3. OPTIONAL: ENHANCE MAIN LOOP:
//  *    - Could modify src/index.ts to automatically check for and display todos
//  *    - But this is optional as the agent can use the tools manually
//  *
//  * THIS FILE DEMONSTRATES THE CONCEPTUAL IMPLEMENTATION:
//  */

// /**
//  * Todo Item Interface - matches what would be stored
//  */
// interface Todo {
//   id: string;                    // Unique identifier (timestamp-based or UUID)
//   description: string;           // What needs to be done
//   status: 'pending' | 'in_progress' | 'completed';
//   createdAt: string;             // ISO timestamp
//   updatedAt: string;             // ISO timestamp
// }

// /**
//  * Todo Storage Manager
//  * Handles persistence of todos to a JSON file in the working directory.
//  * Follows the same patterns as existing file operations in command.ts.
//  */
// class TodoStorage {
//   private readonly todoFile: string = '.todos.json';
//   private readonly workingDir: string;

//   constructor(workingDir: string = process.cwd()) {
//     this.workingDir = workingDir;
//   }

//   /**
//    * Validates that a file path is safe (within working directory)
//    * Mirrors the checkPathSafety function from command.ts
//    */
//   private validateFilePath(filePath: string): string {
//     const path = require('node:path');
//     const resolved = path.resolve(this.workingDir, filePath);
//     if (!resolved.startsWith(this.workingDir)) {
//       throw new Error(`Unsafe file path: ${filePath}`);
//     }
//     return resolved;
//   }

//   /**
//    * Load todos from the JSON file
//    */
//   async loadTodos(): Promise<Todo[]> {
//     const fs = await import('node:fs/promises');
//     try {
//       const filePath = this.validateFilePath(this.todoFile);
//       const data = await fs.readFile(filePath, 'utf8');
//       return JSON.parse(data) as Todo[];
//     } catch (error) {
//       // If file doesn't exist or is invalid, return empty array
//       if ((error as any).code === 'ENOENT') {
//         return [];
//       }
//       throw error;
//     }
//   }

//   /**
//    * Save todos to the JSON file
//    */
//   async saveTodos(todos: Todo[]): Promise<void> {
//     const fs = await import('node:fs/promises');
//     const path = await import('node:path');
//     const dirPath = path.dirname(this.validateFilePath(this.todoFile));

//     // Ensure directory exists
//     try {
//       await fs.mkdir(dirPath, { recursive: true });
//     } catch (err) {
//       // Directory might already exist
//     }

//     const filePath = this.validateFilePath(this.todoFile);
//     const data = JSON.stringify(todos, null, 2);
//     await fs.writeFile(filePath, data, 'utf8');
//   }

//   /**
//    * Add a new todo
//    */
//   async addTodo(description: string): Promise<Todo> {
//     const todos = await this.loadTodos();
//     const newTodo: Todo = {
//       id: Date.now().toString(), // Simple ID generation
//       description,
//       status: 'pending',
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString()
//     };
//     todos.push(newTodo);
//     await this.saveTodos(todos);
//     return newTodo;
//   }

//   /**
//    * Get the next pending todo (first one with status 'pending')
//    */
//   async getNextPendingTodo(): Promise<Todo | null> {
//     const todos = await this.loadTodos();
//     return todos.find(todo => todo.status === 'pending') || null;
//   }

//   /**
//    * Update todo status by ID
//    */
//   async updateTodoStatus(id: string, status: Todo['status']): Promise<Todo | null> {
//     const todos = await this.loadTodos();
//     const todoIndex = todos.findIndex(todo => todo.id === id);
//     if (todoIndex === -1) return null;

//     todos[todoIndex] = {
//       ...todos[todoIndex],
//       status,
//       updatedAt: new Date().toISOString()
//     };

//     await this.saveTodos(todos);
//     return todos[todoIndex];
//   }

//   /**
//    * Mark todo as in progress
//    */
//   async markInProgress(id: string): Promise<Todo | null> {
//     return this.updateTodoStatus(id, 'in_progress');
//   }

//   /**
//    * Mark todo as completed
//    */
//   async markCompleted(id: string): Promise<Todo | null> {
//     return this.updateTodoStatus(id, 'completed');
//   }

//   /**
//    * Get all todos
//    */
//   async listTodos(): Promise<Todo[]> {
//     return this.loadTodos();
//   }

//   /**
//    * Clear all todos (useful for testing or resetting)
//    */
//   async clearTodos(): Promise<void> {
//     await this.saveTodos([]);
//   }
// }

// /**
//  * TOOL IMPLEMENTATIONS (to be added to command.ts)
//  *
//  * These functions would be added to src/utils/command.ts and exported:
//  */

// // Example implementations (matching the style of existing functions):

// async function runTodoAdd(description: string): Promise<string> {
//   try {
//     const storage = new TodoStorage();
//     const todo = await storage.addTodo(description);
//     return `Todo added: ${todo.id} - ${todo.description}`;
//   } catch (error) {
//     return `Error adding todo: ${error}`;
//   }
// }

// async function runTodoList(): Promise<string> {
//   try {
//     const storage = new TodoStorage();
//     const todos = await storage.listTodos();
//     if (todos.length === 0) return 'No todos found';

//     const formatted = todos.map(todo => {
//       const statusSymbol = todo.status === 'completed' ? '✓'
//                          : todo.status === 'in_progress' ? '∷'
//                          : '□';
//       return `${statusSymbol} [${todo.id}] ${todo.description}`;
//     }).join('\n');

//     return `Todos:\n${formatted}`;
//   } catch (error) {
//     return `Error listing todos: ${error}`;
//   }
// }

// async function runTodoUpdate(id: string, status: string): Promise<string> {
//   try {
//     const storage = new TodoStorage();
//     const todo = await storage.updateTodoStatus(id, status as any);
//     if (!todo) return `Todo with id ${id} not found`;

//     return `Todo updated: ${todo.id} - [${todo.status}] ${todo.description}`;
//   } catch (error) {
//     return `Error updating todo: ${error}`;
//   }
// }

// /**
//  * TOOL DEFINITIONS (to be added to tools.ts)
//  *
//  * These would be added to the TOOLS and PARENT_TOOLS objects in src/utils/tools.ts:
//  */

// /*
//   todo_add: tool({
//       description: "Add a new todo item",
//       inputSchema: zodSchema(z.object({
//         description: z.string().describe("Description of the todo item")
//       })),
//       execute: (async ({ description }: { description: string }) => {
//           return await runTodoAdd(description);
//       })
//   }),

//   todo_list: tool({
//       description: "List all todo items",
//       inputSchema: zodSchema(z.object({})),
//       execute: (async () => {
//           return await runTodoList();
//       })
//   }),

//   todo_update: tool({
//       description: "Update the status of a todo item",
//       inputSchema: zodSchema(z.object({
//         id: z.string().describe("ID of the todo to update"),
//         status: z.enum(['pending', 'in_progress', 'completed']).describe("New status for the todo")
//       })),
//       execute: (async ({ id, status }: { id: string, status: 'pending' | 'in_progress' | 'completed' }) => {
//           return await runTodoUpdate(id, status);
//       })
//   })
// */

// /**
//  * SYSTEM PROMPT ENHANCEMENT (to be added to prompt.ts)
//  *
//  * Add this to getRootSystemPrompt() in src/utils/prompt.ts:
//  */

// /*
//   Additionally, for complex tasks that require multiple steps:

//   - Before starting a complex task, use todo_add to create todo items for each step
//   - Use todo_list to see your current todos
//   - When starting work on a todo, use todo_update to mark it as 'in_progress'
//   - When finishing a todo, use todo_update to mark it as 'completed'
//   - Only work on one todo at a time to maintain focus
//   - If a todo seems too large, break it into smaller sub-todos

//   Your current working directory is: ${WORKING_DIR}

//   Available tools include: ${Object.keys(PARENT_TOOLS).join(", ")},
//   todo_add, todo_list, todo_update
// */

// /**
//  * USAGE EXAMPLE IN AGENT FLOW:
//  *
//  * User says: "Create a simple calculator app with addition, subtraction, multiplication, and division"
//  *
//  * Agent thinks: This is a complex task requiring multiple steps
//  * Agent uses: todo_add("Create project structure")
//  * Agent uses: todo_add("Implement addition function")
//  * Agent uses: todo_add("Implement subtraction function")
//  * Agent uses: todo_add("Implement multiplication function")
//  * Agent uses: todo_add("Implement division function")
//  * Agent uses: todo_add("Create user interface")
//  * Agent uses: todo_add("Test all operations")
//  *
//  * Agent uses: todo_list (to see the list)
//  *
//  * Agent starts with first todo:
//  * Agent uses: todo_update("1", "in_progress")
//  * Agent works on creating project structure...
//  * Agent uses: todo_update("1", "completed")
//  *
//  * Agent moves to next todo:
//  * Agent uses: todo_update("2", "in_progress")
//  * Agent implements addition function...
//  * Agent uses: todo_update("2", "completed")
//  *
//  * And so on...
//  */

// /**
//  * BENEFITS OF THIS APPROACH:
//  *
//  * 1. PREVENTS FOCUS LOSS: Agent explicitly works on one todo at a time
//  * 2. PROGRESS TRACKING: User can see what's been completed
//  * 3. TASK BREAKDOWN: Encourages breaking large tasks into manageable pieces
//  * 4. RESUMABILITY: If conversation is interrupted, todos persist and work can continue
//  * 5. CLEAR COMPLETION CRITERIA: Each todo has a clear done/not-done state
//  *
//  * INTEGRATION NOTES:
//  *
//  * - The todo storage file (.todos.json) should be added to .gitignore
//  * - Error handling follows the same pattern as existing file operations
//  * - Uses async/await consistently with the existing codebase
//  * - Follows the same security principles (path validation)
//  * - Minimal changes required to existing code - just add new tools and enhance prompt
//  */

// // Export for potential use in other modules (though primarily for demonstration)
// export { Todo, TodoStorage };
// export { runTodoAdd, runTodoList, runTodoUpdate };