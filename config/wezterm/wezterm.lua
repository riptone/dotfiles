-- One config for macOS and Windows. Mirrors ghostty/config: Tokyo Night,
-- JetBrains Mono, ctrl+a leader with vim-direction splits.
local wezterm = require("wezterm")
local act = wezterm.action
local config = wezterm.config_builder()

local mac = wezterm.target_triple:find("apple") ~= nil
local windows = wezterm.target_triple:find("windows") ~= nil

config.color_scheme = "Tokyo Night"
config.font = wezterm.font("JetBrainsMono Nerd Font")
config.font_size = mac and 14 or 11
config.harfbuzz_features = { "calt", "liga", "dlig", "ss01", "ss02", "ss03", "ss04", "ss05", "ss06", "ss07", "ss08" }

config.default_cursor_style = "BlinkingBar"
config.hide_mouse_cursor_when_typing = true
config.window_background_opacity = mac and 0.95 or 1.0
config.macos_window_background_blur = 8
config.window_decorations = "INTEGRATED_BUTTONS|RESIZE"
config.integrated_title_button_color = "#ff9e64"
config.window_padding = { left = 8, right = 8, top = 8, bottom = 8 }
config.window_close_confirmation = "NeverPrompt"
config.use_fancy_tab_bar = false
config.hide_tab_bar_if_only_one_tab = false

-- PT-PT layout: option+2 must type @ on macOS, not an escape sequence.
config.send_composed_key_when_left_alt_is_pressed = true
config.send_composed_key_when_right_alt_is_pressed = true

if windows then
  config.default_prog = { "pwsh.exe", "-NoLogo" }
  -- Intel Iris Xe flickers a line at the window edge with the OpenGL frontend.
  config.front_end = "WebGpu"
  config.webgpu_power_preference = "HighPerformance"
end

config.leader = { key = "a", mods = "CTRL", timeout_milliseconds = 1000 }
config.keys = {
  -- leader twice sends a real ^A, like tmux's send-prefix
  { key = "a", mods = "LEADER|CTRL", action = act.SendKey({ key = "a", mods = "CTRL" }) },

  { key = "h", mods = "LEADER", action = act.SplitPane({ direction = "Left" }) },
  { key = "j", mods = "LEADER", action = act.SplitPane({ direction = "Down" }) },
  { key = "k", mods = "LEADER", action = act.SplitPane({ direction = "Up" }) },
  { key = "l", mods = "LEADER", action = act.SplitPane({ direction = "Right" }) },

  { key = "h", mods = "CTRL", action = act.ActivatePaneDirection("Left") },
  { key = "j", mods = "CTRL", action = act.ActivatePaneDirection("Down") },
  { key = "k", mods = "CTRL", action = act.ActivatePaneDirection("Up") },
  { key = "l", mods = "CTRL", action = act.ActivatePaneDirection("Right") },

  { key = "f", mods = "LEADER", action = act.TogglePaneZoomState },
  { key = "x", mods = "LEADER", action = act.CloseCurrentPane({ confirm = false }) },
  { key = "n", mods = "LEADER", action = act.ActivateTabRelative(1) },
  { key = "p", mods = "LEADER", action = act.ActivateTabRelative(-1) },
  { key = "n", mods = "CTRL", action = act.SpawnWindow },

  { key = "t", mods = "LEADER", action = act.SpawnTab("CurrentPaneDomain") },
  { key = "w", mods = "LEADER", action = act.CloseCurrentTab({ confirm = false }) },
}

for i = 1, 8 do
  table.insert(config.keys, { key = tostring(i), mods = "LEADER", action = act.ActivateTab(i - 1) })
end
table.insert(config.keys, { key = "9", mods = "LEADER", action = act.ActivateTab(-1) })

return config
