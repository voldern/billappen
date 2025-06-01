#!/bin/bash

# Update all screen files to use the new useSystemInsets hook
cd /Users/espen/kode/native/forerkortet/forerkortet-app/src/screens

# Replace the import statement
find . -name "*.tsx" -type f -exec sed -i '' 's/useEdgeToEdgeInsets/useSystemInsets/g' {} \;
find . -name "*.tsx" -type f -exec sed -i '' 's/hooks\/useEdgeToEdgeInsets/hooks\/useSystemInsets/g' {} \;

echo "Updated all screen files to use useSystemInsets"