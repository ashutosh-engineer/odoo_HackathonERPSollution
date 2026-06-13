import glob

files = glob.glob('backend/*/security/ir.model.access.csv')
for f in files:
    with open(f, 'r') as file:
        lines = file.read().splitlines()
    
    clean_lines = [line for line in lines if not line.startswith('#')]
    
    with open(f, 'w') as file:
        file.write('\n'.join(clean_lines) + '\n')

print(f"Cleaned {len(files)} files.")
