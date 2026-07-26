import {exec, spawn, fork, spawnSync} from "child_process"
import path from "path"

// exec('pwd', (error, stdout, stderr)=>{
//     if(error){
//         console.error("Execution error : ", error)
//         return
//     }
//     if (stderr){
//         console.error(`stderr : ${stderr}`)
//         return
//     }
//     console.log(stdout)
//     // const files = stdout.split("\n")
//     // const finalFiles = files.filter((file)=>file != "")
//     // console.log(finalFiles)
//     console.log(typeof(stdout))
// })

export function runBash(command : string) : string{
    try {
        const result = spawnSync("sh", ["-c", command],{
            cwd : path.join(import.meta.dirname, ".."),
            encoding : "utf8",
            timeout : 120000
        })
        console.log(result)
        return (result.stdout + result.stderr).trim().slice(0,50000 ) || ""
    } catch (error) {
        console.error(`error : ${error}`)
        return 'Error running bash command'
    }
}

// console.log(runBash("pwd1"))
