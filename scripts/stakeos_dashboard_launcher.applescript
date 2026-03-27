on run
	set appPath to POSIX path of (path to me)
	set projectDir to do shell script "dirname " & quoted form of appPath
	set launcherPath to projectDir & "/Launch StakeOS Dashboard.command"
	set shellCommand to "cd " & quoted form of projectDir & " && chmod +x " & quoted form of launcherPath & " && nohup " & quoted form of launcherPath & " >> .run/dashboard-app.log 2>&1 &"
	do shell script "/bin/zsh -lc " & quoted form of shellCommand
end run
