#!/usr/bin/env python3
"""
Accessibility Checker - Auditoria de conformidade WCAG
Verifica arquivos HTML/JSX/TSX em busca de problemas de acessibilidade.

Uso:
    python accessibility_checker.py <project_path>
"""

import sys
import json
import re
from pathlib import Path
from datetime import datetime

# Ajuste de codificação para console Windows
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except:
    pass

def find_html_files(project_path: Path) -> list:
    """Encontra arquivos HTML/JSX/TSX."""
    patterns = ['**/*.html', '**/*.jsx', '**/*.tsx']
    skip_dirs = {'node_modules', '.next', 'dist', 'build', '.git'}
    
    files = []
    for pattern in patterns:
        for f in project_path.glob(pattern):
            if not any(skip in f.parts for skip in skip_dirs):
                files.append(f)
    
    return files[:50]

def check_accessibility(file_path: Path) -> list:
    """Verifica um arquivo individual."""
    issues = []
    
    try:
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        
        # Inputs sem labels
        inputs = re.findall(r'<input[^>]*>', content, re.IGNORECASE)
        for inp in inputs:
            if 'type="hidden"' not in inp.lower():
                if 'aria-label' not in inp.lower() and 'id=' not in inp.lower():
                    issues.append("Input sem label ou aria-label")
                    break
        
        # Botões sem texto acessível
        buttons = re.findall(r'<button[^>]*>[^<]*</button>', content, re.IGNORECASE)
        for btn in buttons:
            if 'aria-label' not in btn.lower():
                text = re.sub(r'<[^>]+>', '', btn)
                if not text.strip():
                    issues.append("Botão sem texto acessível ou aria-label")
                    break
        
        # Atributo lang ausente
        if '<html' in content.lower() and 'lang=' not in content.lower():
            issues.append("Atributo 'lang' ausente na tag <html>")
        
        # Handlers de clique sem suporte a teclado
        onclick_count = content.lower().count('onclick=')
        onkeydown_count = content.lower().count('onkeydown=') + content.lower().count('onkeyup=')
        if onclick_count > 0 and onkeydown_count == 0:
            issues.append("onClick detectado sem manipulador de teclado (onKeyDown)")
        
    except Exception as e:
        issues.append(f"Erro ao ler arquivo: {str(e)[:50]}")
    
    return issues

def main():
    project_path = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    
    print(f"\n{'='*60}")
    print(f"[ACCESSIBILITY CHECKER] Auditoria WCAG")
    print(f"{'='*60}")
    
    files = find_html_files(project_path)
    
    all_issues = []
    for f in files:
        issues = check_accessibility(f)
        if issues:
            all_issues.append({"file": str(f.name), "issues": issues})
    
    if all_issues:
        for item in all_issues[:10]:
            print(f"\n{item['file']}:")
            for issue in item["issues"]:
                print(f"  - {issue}")
    else:
        print("Nenhum problema de acessibilidade crítica encontrado!")

    total_issues = sum(len(item["issues"]) for item in all_issues)
    passed = total_issues < 5
    
    output = {
        "script": "accessibility_checker",
        "files_checked": len(files),
        "issues_found": total_issues,
        "passed": passed
    }
    print("\n" + json.dumps(output, indent=2))

if __name__ == "__main__":
    main()
