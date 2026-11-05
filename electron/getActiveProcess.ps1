$sig = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
namespace Win32 {
  public class Win32Util {
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int processId);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern IntPtr MonitorFromWindow(IntPtr hwnd, uint dwFlags);
    [DllImport("user32.dll", CharSet = CharSet.Auto)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
  }
}
"@
if (-not ([System.Management.Automation.PSTypeName]"Win32.Win32Util").Type) {
  Add-Type -TypeDefinition $sig -ErrorAction SilentlyContinue
}

$fgHwnd = [Win32.Win32Util]::GetForegroundWindow()
$procId = 0
$null = [Win32.Win32Util]::GetWindowThreadProcessId($fgHwnd, [ref]$procId)

$sb = New-Object System.Text.StringBuilder 256
$null = [Win32.Win32Util]::GetWindowText($fgHwnd, $sb, $sb.Capacity)
$fgTitle = ($sb.ToString() + "").ToLower()

$fgName = ""
if ($procId -gt 0) {
  $fgProc = Get-Process -Id $procId -ErrorAction SilentlyContinue
  if ($fgProc) { $fgName = ($fgProc.ProcessName + "").ToLower() }
}

if ($fgName -match "fivem|gta|cfx" -or $fgTitle -match "fivem|grand theft auto|gta world") {
  Write-Output "FOREGROUND_FIVEM"
  exit 0
}

if ($fgTitle -match "gtaw log studio") {
  Write-Output "FOREGROUND_STUDIO"
  exit 0
}

$gameProcs = Get-Process -ErrorAction SilentlyContinue | Where-Object {
  $_.MainWindowHandle -ne 0 -and (
    $_.ProcessName -match "fivem|gta|cfx" -or
    $_.MainWindowTitle -match "FiveM|Grand Theft Auto|GTA World"
  )
}

foreach ($gp in $gameProcs) {
  $gHwnd = $gp.MainWindowHandle
  $isMin = [Win32.Win32Util]::IsIconic($gHwnd)
  $isVis = [Win32.Win32Util]::IsWindowVisible($gHwnd)
  if (-not $isMin -and $isVis) {
    $fgMon = [Win32.Win32Util]::MonitorFromWindow($fgHwnd, 2)
    $gMon = [Win32.Win32Util]::MonitorFromWindow($gHwnd, 2)
    if ($fgMon -ne [IntPtr]::Zero -and $gMon -ne [IntPtr]::Zero -and $fgMon -ne $gMon) {
      Write-Output "VISIBLE_SECOND_MONITOR"
      exit 0
    }
    Write-Output "ALTTAB_COVERED"
    exit 0
  }
}

Write-Output "ALTTAB_HIDDEN"
