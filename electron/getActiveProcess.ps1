$sig = @"
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int processId);
"@
if (-not ([System.Management.Automation.PSTypeName]"Win32.Win32Util").Type) { Add-Type -MemberDefinition $sig -Name "Win32Util" -Namespace "Win32" }
$hwnd = [Win32.Win32Util]::GetForegroundWindow()
$procId = 0
$null = [Win32.Win32Util]::GetWindowThreadProcessId($hwnd, [ref]$procId)
if ($procId -gt 0) { (Get-Process -Id $procId -ErrorAction SilentlyContinue).ProcessName }