const util = require('util')
const { exec, spawn } = require('child_process');
const { existsSync } = require('fs');
const { rm, mkdir } = require('fs/promises');
const stable = process.env.MODE === 'production';

const execAsync = util.promisify(exec);

async function start() {

    await rm("./output", { recursive: true }).catch(() => { });
    await mkdir("./output");

    const has_node_modules = {
        website: existsSync("./website/node_modules"),
        api: existsSync("./server/node_modules")
    }

    if (!has_node_modules.website || !has_node_modules.api) {

        console.log("[\x1b[36mPRELOAD\x1b[0m] - \x1b[32mInstalando os pacotes do servidor e/ou website...\x1b[0m");

        const promises = [];

        if (!has_node_modules.website) promises.push(
            execAsync("cd website && npm update")
        );

        if (!has_node_modules.api) promises.push(
            execAsync("cd server && npm update")
        );

        await Promise.all(promises);

        console.log("[\x1b[36mPRELOAD\x1b[0m] - \x1b[32mPacotes instalados.\x1b[0m");

    }

    let spawn_commands = {
        website: `cd website `,
        api: `cd server `
    };

    if (stable) {
        spawn_commands.website += `&& npm run build && npm run preview`;
        spawn_commands.api += `&& npm start`;
    } else {
        spawn_commands.website += `&& npm run dev`;
        spawn_commands.api += `&& npm run dev`;
    }

    process.stdout.write("[\x1b[36mPRELOAD\x1b[0m] - \x1b[32mInicializando o website e API.\x1b[0m");

    const website = spawn(spawn_commands.website, { shell: true, });
    const api = spawn(spawn_commands.api, { shell: true });
    const handle_stdout = (data, source, file) => {

        const spplited_data = data.toString().split("\n");
        let output = "";
        let last_line = "";
        
        for (const line of spplited_data) {

            if (!line && last_line) {
                last_line = line;
                continue;
            }

            output += `\n[\x1b[35m${source}\x1b[0m] ` + line
            last_line = line;

        }

        process.stdout.write(output);

        execAsync(`echo "${data}" >> output/${file}`);

    }

    website.stdout.on('data', data => { handle_stdout(data, "WEBSITE", 'website.log') });
    website.stderr.on('data', data => { handle_stdout(data, "WEBSITE", 'website.log') });
    api.stderr.on('data', data => { handle_stdout(data, "API", 'api.log') });
    api.stdout.on('data', data => { handle_stdout(data, "API", 'api.log') });

}

start();