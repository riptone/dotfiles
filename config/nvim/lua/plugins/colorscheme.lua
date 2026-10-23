-- Same palette as the Pierre extension in VS Code.
return {
  {
    "chaosteil/pierre-theme.nvim",
    priority = 1000,
    lazy = false,
    config = function()
      require("pierre").setup({ style = "dark" })
      vim.cmd.colorscheme("pierre")
    end,
  },
  { "folke/tokyonight.nvim", enabled = false },
  {
    "nvim-lualine/lualine.nvim",
    optional = true,
    opts = { options = { theme = "pierre" } },
  },
}
