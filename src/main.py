"""
DemeRadio 94.9 FM - Punto de Entrada Principal (main.py)
Emisora oficial en español de la comunidad de Demenishki.
Genera intervenciones de voz e interacciones de radio entre pistas o clips utilizando Gemini AI y síntesis vocal.
"""

import argparse
import json
import os
import sys
from typing import Dict, Any

from src.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    STATION_NAME,
    COMMUNITY_NAME,
    load_system_prompt
)
from src.audio_engine import AudioEngine

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    console = Console()
except ImportError:
    console = None


def print_banner():
    """Muestra el banner de cabina de transmisión en consola."""
    banner_text = (
        f"[bold cyan]📻 {STATION_NAME}[/bold cyan] | [bold yellow]ON AIR[/bold yellow]\n"
        f"[dim]La voz oficial de la {COMMUNITY_NAME}[/dim]\n"
        f"[green]Frecuencia sintonizada: 94.9 MHz • Formato: Dynamic Radio JSON[/green]"
    )
    if console:
        console.print(Panel(banner_text, border_style="cyan", expand=False))
    else:
        print(f"=== {STATION_NAME} | ON AIR ===")


def generate_radio_intervention(
    context_prompt: str,
    desired_mood: str = "energetico",
    siguiente_pista_sugerida: str = "shorts_traducidos"
) -> Dict[str, Any]:
    """
    Invoca la API de Gemini para generar una intervención de radio en formato JSON estricto.
    """
    system_prompt = load_system_prompt()
    user_instruction = (
        f"Contexto del corte de radio:\n"
        f"- Petición o evento actual: {context_prompt}\n"
        f"- Mood deseado: {desired_mood}\n"
        f"- Pista / categoría a la que se debe dar paso: {siguiente_pista_sugerida}\n\n"
        f"Genera la locución respetando el formato JSON estipulado:"
        f'{{"dialogo": "...", "mood": "{desired_mood}", "siguiente_pista": "{siguiente_pista_sugerida}"}}'
    )

    # 1. Intentar con el SDK oficial google-genai
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", ""))
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=user_instruction,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                temperature=0.85,
            )
        )
        content_text = response.text
    except Exception as e:
        # 2. Respaldo: google.generativeai legado si está presente
        try:
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", ""))
            model = legacy_genai.GenerativeModel(
                model_name=GEMINI_MODEL,
                system_instruction=system_prompt
            )
            response = model.generate_content(
                user_instruction,
                generation_config={"response_mime_type": "application/json"}
            )
            content_text = response.text
        except Exception as leg_e:
            if console:
                console.print(f"[yellow]Aviso: No se pudo conectar a la API ({e}). Usando plantilla local de demostración para pruebas.[/yellow]")
            else:
                print(f"Aviso API: {e}. Usando intervención local de prueba.")
            return {
                "dialogo": (
                    "¡Qué pasa, gente de Demenishki! Están en sintonía de DemeRadio 94.9 FM. "
                    "Acaban de subir un nuevo Short traducido con subtítulos nivel legendario, "
                    "así que preparen sus auriculares porque se viene una jugada épica. ¡Dentro clip!"
                ),
                "mood": desired_mood,
                "siguiente_pista": siguiente_pista_sugerida
            }

    # Limpiar y parsear JSON
    clean_text = content_text.strip()
    if clean_text.startswith("```json"):
        clean_text = clean_text[7:]
    if clean_text.startswith("```"):
        clean_text = clean_text[3:]
    if clean_text.endswith("```"):
        clean_text = clean_text[:-3]

    try:
        data = json.loads(clean_text.strip())
        return data
    except Exception as json_err:
        raise ValueError(f"La respuesta de la IA no fue un JSON válido: {clean_text} ({json_err})")


def main():
    parser = argparse.ArgumentParser(
        description="DemeRadio 94.9 FM - Locutor IA para la comunidad de Demenishki"
    )
    parser.add_argument(
        "--prompt",
        type=str,
        default="Anunciar el nuevo short de Minecraft traducido y mandar saludos al chat",
        help="Contexto o evento para la locución"
    )
    parser.add_argument(
        "--mood",
        type=str,
        choices=["energetico", "relajado", "bromista"],
        default="energetico",
        help="Estado de ánimo de la intervención de radio"
    )
    parser.add_argument(
        "--siguiente-pista",
        type=str,
        default="shorts_traducidos",
        help="Nombre de la pista o categoría siguiente"
    )
    parser.add_argument(
        "--no-audio",
        action="store_true",
        help="Generar solo el JSON sin sintetizar audio MP3"
    )
    parser.add_argument(
        "--play",
        action="store_true",
        help="Reproducir automáticamente el audio resultante"
    )

    args = parser.parse_args()
    print_banner()

    if console:
        console.print(f"[bold green]▶ Generando intervención:[/bold green] '{args.prompt}'")
    else:
        print(f"▶ Generando intervención: '{args.prompt}'")

    intervention = generate_radio_intervention(
        context_prompt=args.prompt,
        desired_mood=args.mood,
        siguiente_pista_sugerida=args.siguiente_pista
    )

    # Imprimir resultado JSON
    if console:
        table = Table(title="📡 Salida Oficial DemeRadio 94.9 FM")
        table.add_column("Campo", style="cyan", no_wrap=True)
        table.add_column("Valor", style="magenta")

        table.add_row("mood", intervention.get("mood", "energetico"))
        table.add_row("siguiente_pista", intervention.get("siguiente_pista", ""))
        table.add_row("dialogo", intervention.get("dialogo", ""))

        console.print(table)
        console.print("\n[bold yellow]JSON crudo:[/bold yellow]")
        console.print_json(json.dumps(intervention, ensure_ascii=False, indent=2))
    else:
        print("\n--- SALIDA JSON ---")
        print(json.dumps(intervention, ensure_ascii=False, indent=2))

    # Síntesis de Audio
    if not args.no_audio:
        engine = AudioEngine()
        dialogo = intervention.get("dialogo", "")
        mood = intervention.get("mood", "energetico")
        sec_est = engine.estimate_reading_time_seconds(dialogo)

        if console:
            console.print(f"\n[cyan]🎙️ Sintetizando audio (duración estimada: ~{sec_est}s)...[/cyan]")
        else:
            print(f"🎙️ Sintetizando audio (~{sec_est}s)...")

        try:
            audio_path = engine.synthesize_sync(dialogo, mood=mood)
            if console:
                console.print(f"[bold green]✔ Audio generado exitosamente:[/bold green] [underline]{audio_path}[/underline]")
            else:
                print(f"✔ Audio generado exitosamente: {audio_path}")

            if args.play:
                if console:
                    console.print("[yellow]🔊 Reproduciendo en altavoces...[/yellow]")
                engine.play_audio(audio_path)
        except Exception as err:
            if console:
                console.print(f"[red]Error al sintetizar audio: {err}[/red]")
            else:
                print(f"Error al sintetizar audio: {err}")


if __name__ == "__main__":
    main()
