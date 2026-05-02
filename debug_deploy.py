import subprocess
import os

def run(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT).decode('utf-8')
    except Exception as e:
        return str(e)

with open('diagnostico_caserita.txt', 'w') as f:
    f.write("--- REPORTE DE SISTEMA v4.0 ---\n")
    f.write("Rama Actual: " + run("git branch --show-current"))
    f.write("Remotos:\n" + run("git remote -v"))
    f.write("Status:\n" + run("git status"))
    f.write("Ultimos Commits:\n" + run("git log -n 5 --oneline"))
    if os.path.exists('.vercel/project.json'):
        f.write("Vercel Config:\n" + open('.vercel/project.json').read())
    f.write("--- FIN DEL REPORTE ---\n")
