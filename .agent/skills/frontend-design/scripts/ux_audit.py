#!/usr/bin/env python3
"""
UX Audit Script - Cobertura Completa de Design Frontend

AVISO: Este script foi recebido de forma truncada.
Ele contém apenas a estrutura inicial e algumas verificações básicas.
"""

import sys
import os
import re
import json
from pathlib import Path


class UXAuditor:
    def __init__(self):
        self.issues = []
        self.warnings = []
        self.passed_count = 0
        self.files_checked = 0

    def audit_file(self, filepath: str) -> None:
        try:
            with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
        except:
            return

        self.files_checked += 1
        filename = os.path.basename(filepath)

        # 1. LEIS DE PSICOLOGIA
        # Lei de Hick
        nav_items = len(
            re.findall(r"<NavLink|<Link|<a\s+href|nav-item", content, re.IGNORECASE)
        )
        if nav_items > 7:
            self.issues.append(
                f"[Lei de Hick] {filename}: {nav_items} itens de navegação (Máximo 7)"
            )

        # Lei de Fitts
        if re.search(r"height:\s*([0-3]\d)px", content) or re.search(
            r"h-[1-9]\b|h-10\b", content
        ):
            self.warnings.append(
                f"[Lei de Fitts] {filename}: Alvos de toque pequenos (< 44px)"
            )

        # 2. BANIMENTO DE ROXO (Regra Fica Suave)
        purple_clues = [
            "#8B5CF6",
            "#A855F7",
            "#D8B4FE",
            "purple",
            "violet",
            "indigo-500",
        ]
        for clue in purple_clues:
            if clue in content.lower():
                self.issues.append(
                    f"[Purple Ban] {filename}: Detectado uso de roxo/violeta ({clue})"
                )

    def run_audit(self, project_path):
        for root, _, files in os.walk(project_path):
            if any(x in root for x in ["node_modules", ".next", ".git"]):
                continue
            for file in files:
                if file.endswith((".tsx", ".jsx", ".html", ".css")):
                    self.audit_file(os.path.join(root, file))


if __name__ == "__main__":
    auditor = UXAuditor()
    path = sys.argv[1] if len(sys.argv) > 1 else "."
    auditor.run_audit(path)
    print(f"Auditoria finalizada. Arquivos verificados: {auditor.files_checked}")
    for issue in auditor.issues:
        print(f"❌ {issue}")
    for warn in auditor.warnings:
        print(f"⚠️ {warn}")
