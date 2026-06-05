def normalize_angle(angle: float, rest_angle: float, max_amplitude: float) -> float:
    """Convertit un angle brut en signal normalisé entre -1000 et 1000."""
    signal = ((angle - rest_angle) / (max_amplitude + 1e-6)) * 1000
    return max(-1000.0, min(1000.0, signal))
