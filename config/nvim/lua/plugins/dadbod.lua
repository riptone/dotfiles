-- Connections are generated from the same connections.csv as the dbhub MCP
-- server. The generated file holds credentials, so it stays outside the repo.
return {
  {
    "tpope/vim-dadbod",
    init = function()
      local file = vim.fn.expand("~/.doti/dadbod.lua")
      if vim.fn.filereadable(file) == 0 then
        return
      end
      local ok, dbs = pcall(dofile, file)
      if ok and type(dbs) == "table" then
        vim.g.dbs = dbs
      end
    end,
  },
}
