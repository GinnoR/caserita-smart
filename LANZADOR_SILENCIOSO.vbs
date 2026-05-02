Set WshShell = CreateObject("WScript.Shell")
' Ejecutar el .bat en modo oculto (0) y no esperar a que termine (False)
WshShell.Run "LANZADOR_CASERITA_PC.bat", 0, False
MsgBox "🚀 Caserita Smart PC está arrancando en segundo plano." & vbCrLf & "En unos segundos se abrirá una ventana de aplicación limpia.", 64, "Caserita Smart v4.0"
