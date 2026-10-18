import os
import subprocess

def install_deps(folder):
    if not os.path.exists(os.path.join(folder, 'node_modules')):
        print(f"[{folder}] node_modules missing. Installing dependencies...")
        subprocess.run(["npm", "install"], cwd=folder, shell=True, check=True)
        print(f"[{folder}] dependencies installed successfully.")
    else:
        print(f"[{folder}] node_modules exists. Skipping install.")

if __name__ == "__main__":
    install_deps("frontend")
    install_deps("backend")
