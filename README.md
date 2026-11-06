# Scaffolf-ts-project

This a git repository used to quickly scaffold a typescript library project.

# Installation

- Copy the code below and paste it in you .zshrc file
- Inside the script replace the value of the USERNAME variable with your github username
- Save the .zshrc file and run source ~/.zshrc

```zsh
scaffold() {
  
  local USER_NAME="your-github-username"

  # 1. Guard check: Ensure the user passed a target directory name
  if [ -z "$1" ]; then
    echo "❌ Error: Please specify a target directory name."
    echo "Usage: scaffold-ts my-new-library"
    return 1
  fi

  local TARGET_DIR="$1"

  # 2. Guard check: Prevent accidental overwrites of existing folders
  if [ -d "$TARGET_DIR" ]; then
    echo "❌ Error: A directory named '$TARGET_DIR' already exists in this location."
    return 1
  fi

  echo "📦 Cloning fresh scaffold template from GitHub..."
  # Perform a shallow clone (depth 1) so we don't fetch historical junk timelines
  git clone --depth 1 git@github.com:$USER_NAME/scaffold-ts-project.git "$TARGET_DIR"

  # 3. Guard check: Verify that the clone actually succeeded before running destructive deletes
  if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to clone the repository from GitHub. Aborting execution."
    return 1
  fi

  # Change context into the newly generated directory
  cd "$TARGET_DIR"

  echo "🪓 Obliterating template Git history..."
  rm -rf .git

  echo "🌱 Initializing pristine Git workspace..."
  git init
  git add .
  git commit -m "initial commit: pristine architecture scaffolded from template"

  echo "✅ Success! Project '$TARGET_DIR' is ready to go."
  echo "🚀 Type 'code .' to open it in VS Code."
}
```

# Usage

```zsh
> scaffold dirName
```