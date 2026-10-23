-- One config for macOS and Windows. Mirrors ghostty/config: Pierre dark-soft,
-- JetBrains Mono, ctrl+a leader with vim-direction splits.
local wezterm = require("wezterm")
local act = wezterm.action
local config = wezterm.config_builder()

local mac = wezterm.target_triple:find("apple") ~= nil
local windows = wezterm.target_triple:find("windows") ~= nil

config.colors = {
  background = "#171717",
  foreground = "#8a8a8a",
  cursor_bg = "#69b1ff",
  cursor_fg = "#171717",
  selection_bg = "#1f3e5e",
  selection_fg = "#fafafa",
  ansi = {
    "#171717", "#ff2e3f", "#0dbe4e", "#ffca00",
    "#009fff", "#e130ac", "#08c0ef", "#bcbcbc",
  },
  brights = {
    "#171717", "#ff2e3f", "#86c427", "#ffca00",
    "#009fff", "#e130ac", "#08c0ef", "#bcbcbc",
  },
}
config.font = wezterm.font("JetBrainsMono Nerd Font")
config.font_size = mac and 14 or 11
config.initial_cols = 117
config.initial_rows = 27
config.harfbuzz_features = { "calt", "liga" }
config.animation_fps = 1
config.check_for_updates = false
config.scrollback_lines = 2000
config.automatically_reload_config = false

config.default_cursor_style = "SteadyBar"
config.hide_mouse_cursor_when_typing = true
config.window_background_opacity = 1.0
config.macos_window_background_blur = 0
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
  -- OpenGL uses less memory; switch back to WebGpu if the edge flickers.
  config.front_end = "OpenGL"
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

  -- Ctrl+Shift+Arrow is word selection in the app; don't use it for panes.
  { key = "LeftArrow", mods = "CTRL|SHIFT", action = act.SendKey({ key = "LeftArrow", mods = "CTRL|SHIFT" }) },
  { key = "RightArrow", mods = "CTRL|SHIFT", action = act.SendKey({ key = "RightArrow", mods = "CTRL|SHIFT" }) },
  { key = "UpArrow", mods = "CTRL|SHIFT", action = act.SendKey({ key = "UpArrow", mods = "CTRL|SHIFT" }) },
  { key = "DownArrow", mods = "CTRL|SHIFT", action = act.SendKey({ key = "DownArrow", mods = "CTRL|SHIFT" }) },

  { key = "f", mods = "LEADER", action = act.TogglePaneZoomState },
  { key = "x", mods = "LEADER", action = act.CloseCurrentPane({ confirm = false }) },
  { key = "n", mods = "LEADER", action = act.ActivateTabRelative(1) },
  { key = "p", mods = "LEADER", action = act.ActivateTabRelative(-1) },
  { key = "n", mods = "CTRL", action = act.SpawnWindow },

  -- WezTerm's mouse selection is invisible to PSReadLine, so copy here. At a shell prompt
  -- with nothing selected, send nothing (no ^C echo); elsewhere pass ^C through.
  {
    key = "c",
    mods = "CTRL",
    action = wezterm.action_callback(function(window, pane)
      if window:get_selection_text_for_pane(pane) ~= "" then
        window:perform_action(act.CopyTo("ClipboardAndPrimarySelection"), pane)
      elseif not pane:get_foreground_process_name():find("pwsh") then
        window:perform_action(act.SendKey({ key = "c", mods = "CTRL" }), pane)
      end
    end),
  },

  -- Ctrl+C copies a selection; with nothing selected it still reaches the shell as ^C
  {
    key = "c",
    mods = "CTRL",
    action = wezterm.action_callback(function(window, pane)
      if window:get_selection_text_for_pane(pane) ~= "" then
        window:perform_action(act.CopyTo("ClipboardAndPrimarySelection"), pane)
      else
        window:perform_action(act.SendKey({ key = "c", mods = "CTRL" }), pane)
      end
    end),
  },

  { key = "t", mods = "LEADER", action = act.SpawnTab("CurrentPaneDomain") },
  { key = "w", mods = "LEADER", action = act.CloseCurrentTab({ confirm = false }) },
}

for i = 1, 8 do
  table.insert(config.keys, { key = tostring(i), mods = "LEADER", action = act.ActivateTab(i - 1) })
end
table.insert(config.keys, { key = "9", mods = "LEADER", action = act.ActivateTab(-1) })

return config
