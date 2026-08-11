import * as fs from "node:fs"
import * as path from "node:path"
import type { Task } from "./types.js"
import { WORKING_DIR } from "../utils/model.js"

export const TASK_DIR = path.join(WORKING_DIR, ".tasks")
export let LAST_ID = 0
export const TASK_EXT = ".json"
export const TaskFilePath = path.join(TASK_DIR, `task${TASK_EXT}`)


function ensureTaskDirectory(){
    if(!fs.existsSync(TASK_DIR)){
        fs.mkdirSync(TASK_DIR,{ recursive : true})
    }
}

function writeTask(tasks : Task[]){
    // writes all the tasks in the .tasks/ direcory
    ensureTaskDirectory()
    console.log('========WRITING TASKS==========')
    const taskToBeWritten = {
        tasks : tasks
    }
    try {
        fs.writeFileSync(TaskFilePath, JSON.stringify(taskToBeWritten, null, 2), "utf-8")

    } catch (error) {
        throw new Error(`Error while writing to ${TASK_DIR} directory : ${error}`)
    }
}

function readTask(){
    // reads a given task from the .task 
    ensureTaskDirectory()
    console.log('========READING TASKS==========')
    try {
        const data = fs.readFileSync(TaskFilePath, "utf-8")
        const tasks = JSON.parse(data)

        return tasks?.tasks
    } catch (error) {
        throw new Error(`Error while reading from ${TASK_DIR} directory : ${error}`)
        
    }
}


function editTask(taskid : string, updatedTaskForRespectiveId : Task){
    // edit a particular task with given task_id
    ensureTaskDirectory()
    console.log('========EDIT TASKS==========')

    try {
        const data = fs.readFileSync(TaskFilePath, "utf-8")
        const obj = JSON.parse(data)
        const tasks = obj?.tasks

        // get the particular task with the taskid

        let targetTaskIdx;

        tasks.findIndex((task : Task)=>task.taskid === taskid)

        if(targetTaskIdx && targetTaskIdx != -1){
            tasks[targetTaskIdx] = {
                ...tasks[targetTaskIdx],
                ...updatedTaskForRespectiveId,
                taskid
            }

            fs.writeFileSync(TaskFilePath, JSON.stringify(tasks, null, 2), "utf-8")

            return {
                success : true,
                task : tasks[targetTaskIdx]
            }
        }
        else{
            return `no task with id :${taskid} found`
        }
    } catch (error) {
        throw new Error(`Error while updating tasks in ${TASK_DIR} directory : ${error}`)
    }
}

export  {
    writeTask,
    readTask,
    editTask
}