// vite.config.ts
import { defineConfig } from "file:///C:/Users/gener/OneDrive/Documents/COMPANIES/OFS/ofs-ledger/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/gener/OneDrive/Documents/COMPANIES/OFS/ofs-ledger/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/Users/gener/OneDrive/Documents/COMPANIES/OFS/ofs-ledger/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\gener\\OneDrive\\Documents\\COMPANIES\\OFS\\ofs-ledger";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    historyApiFallback: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path2) => path2.replace(/^\/api/, "")
      }
    },
    middleware: (app) => {
      app.use((req, res, next) => {
        if (!req.url?.includes(".") && !req.url?.startsWith("/api")) {
          req.url = "/index.html";
        }
        next();
      });
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxnZW5lclxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudHNcXFxcQ09NUEFOSUVTXFxcXE9GU1xcXFxvZnMtbGVkZ2VyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxnZW5lclxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudHNcXFxcQ09NUEFOSUVTXFxcXE9GU1xcXFxvZnMtbGVkZ2VyXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9nZW5lci9PbmVEcml2ZS9Eb2N1bWVudHMvQ09NUEFOSUVTL09GUy9vZnMtbGVkZ2VyL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcbmltcG9ydCB0eXBlIHsgQ29ubmVjdCB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCB0eXBlIHsgU2VydmVyUmVzcG9uc2UgfSBmcm9tIFwiaHR0cFwiO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6IFwiOjpcIixcclxuICAgIHBvcnQ6IDgwODAsXHJcbiAgICBoaXN0b3J5QXBpRmFsbGJhY2s6IHRydWUsXHJcbiAgICBwcm94eToge1xyXG4gICAgICBcIi9hcGlcIjoge1xyXG4gICAgICAgIHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjgwODBcIixcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sIFwiXCIpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIG1pZGRsZXdhcmU6IChhcHA6IENvbm5lY3QuU2VydmVyKSA9PiB7XHJcbiAgICAgIGFwcC51c2UoKHJlcTogQ29ubmVjdC5JbmNvbWluZ01lc3NhZ2UsIHJlczogU2VydmVyUmVzcG9uc2UsIG5leHQ6IENvbm5lY3QuTmV4dEZ1bmN0aW9uKSA9PiB7XHJcbiAgICAgICAgaWYgKCFyZXEudXJsPy5pbmNsdWRlcygnLicpICYmICFyZXEudXJsPy5zdGFydHNXaXRoKCcvYXBpJykpIHtcclxuICAgICAgICAgIHJlcS51cmwgPSAnL2luZGV4Lmh0bWwnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBuZXh0KCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmXHJcbiAgICBjb21wb25lbnRUYWdnZXIoKSxcclxuICBdLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxufSkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdYLFNBQVMsb0JBQW9CO0FBQzdZLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFRekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixvQkFBb0I7QUFBQSxJQUNwQixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxTQUFTLENBQUNBLFVBQVNBLE1BQUssUUFBUSxVQUFVLEVBQUU7QUFBQSxNQUM5QztBQUFBLElBQ0Y7QUFBQSxJQUNBLFlBQVksQ0FBQyxRQUF3QjtBQUNuQyxVQUFJLElBQUksQ0FBQyxLQUE4QixLQUFxQixTQUErQjtBQUN6RixZQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsR0FBRyxLQUFLLENBQUMsSUFBSSxLQUFLLFdBQVcsTUFBTSxHQUFHO0FBQzNELGNBQUksTUFBTTtBQUFBLFFBQ1o7QUFDQSxhQUFLO0FBQUEsTUFDUCxDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFNBQVMsaUJBQ1QsZ0JBQWdCO0FBQUEsRUFDbEIsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFsicGF0aCJdCn0K
