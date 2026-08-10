export type TaskStatus = "pending" | "completed" | "failed" | "in_progress"

export interface Task {
    taskid : string,
    title : string, 
    description : string, 
    // blockedBy : string[],
    status : TaskStatus
}


/*
 *   i need to add a task manager that can manage the tasks and their status.

I will create .tasks/task.json file {Task[]} which will contain all the tasks and their status.

The agent in the beginning will read the tasks from the .tasks/task.json file and will update the status of the tasks as it progresses. Once all the tasks are finished, the agent will remove that file and will create a new file with the new tasks.

If the agent is restarted, it will read the tasks from the .tasks/task.json file and will continue from where it left off, but not automatically start the tasks, it will wait for the user to start the tasks again (when prompted explicitly)
 * 
 */