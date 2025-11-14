/**
 * Weather System
 *
 * Manages weather effects on the battlefield.
 * Weather changes randomly every 5-8 turns.
 */

import type { WeatherEffect, WeatherType } from '../types/core';
import { WEATHER_TYPES } from '../types/core';

export class WeatherSystem {
  private static readonly BASIC_WEATHER_TYPES: WeatherType[] = [
    'CLEAR',
    'RAIN',
    'STORM',
    'FOG',
    'SNOW',
  ];

  /**
   * Generate a random weather effect
   */
  static generateRandomWeather(): WeatherEffect | null {
    const random = Math.random();

    // 30% chance of clear weather (no effect)
    if (random < 0.3) {
      return null;
    }

    const type = this.BASIC_WEATHER_TYPES[Math.floor(Math.random() * this.BASIC_WEATHER_TYPES.length)];

    if (type === 'CLEAR') {
      return null;
    }

    return this.createWeatherEffect(type);
  }

  /**
   * Create a specific weather effect
   */
  static createWeatherEffect(type: WeatherType): WeatherEffect {
    const duration = Math.floor(Math.random() * 4) + 3; // 3-6 turns
    const weatherData = WEATHER_TYPES[type];

    return {
      ...weatherData,
      turnsRemaining: duration,
    };
  }

  /**
   * Get weather icon for UI
   */
  static getWeatherIcon(type: WeatherType): string {
    return WEATHER_TYPES[type]?.icon || '☀️';
  }

  /**
   * Get weather description for battle log
   */
  static getWeatherDescription(type: WeatherType): string {
    switch (type) {
      case 'CLEAR':
        return 'The skies are clear and calm';
      case 'RAIN':
        return 'Rain begins to fall, dampening the battlefield';
      case 'STORM':
        return 'A fierce storm rages, lightning crackling overhead';
      case 'FOG':
        return 'Dense fog rolls in, obscuring vision';
      case 'SNOW':
        return 'Snow begins to fall, freezing the battlefield';
      case 'BLIZZARD':
        return 'A howling blizzard engulfs the battlefield, visibility near zero';
      case 'SANDSTORM':
        return 'Stinging sands whip across the battlefield, blinding combatants';
      case 'HEATWAVE':
        return 'Scorching heat radiates across the field, sapping strength';
      case 'ARCANE_STORM':
        return 'Reality itself warps as arcane energy crackles through the air';
      case 'BLOOD_MOON':
        return 'A crimson moon rises, filling warriors with bloodlust';
      default:
        return 'The weather shifts';
    }
  }

  /**
   * Get tactical advice for weather
   */
  static getWeatherTactics(type: WeatherType): string {
    switch (type) {
      case 'CLEAR':
        return 'Standard conditions. No weather modifiers.';
      case 'RAIN':
        return 'Attack power reduced. Focus on defense.';
      case 'STORM':
        return 'Heavy attack penalty. Defensive formations recommended.';
      case 'FOG':
        return 'Attack reduced but defense increased. Good for turtling.';
      case 'SNOW':
        return 'Speed greatly reduced. Plan moves carefully.';
      case 'BLIZZARD':
        return 'Severe penalties to attack and speed. Defensive stance advised.';
      case 'SANDSTORM':
        return 'Reduced visibility affects all stats. Brace for attrition.';
      case 'HEATWAVE':
        return 'Increased aggression but reduced defense. High-risk offense.';
      case 'ARCANE_STORM':
        return 'Magical chaos! Attack and speed boosted but defense weakened.';
      case 'BLOOD_MOON':
        return 'Extreme bloodlust! Massive attack bonus but vulnerable defense.';
      default:
        return 'Standard conditions.';
    }
  }

  /**
   * Check if weather should change this turn
   */
  static shouldChangeWeather(currentTurn: number): boolean {
    // Weather changes every 5-8 turns
    if (currentTurn === 1) return true; // Initial weather
    if (currentTurn % 7 === 0) return Math.random() < 0.4; // 40% chance every 7 turns
    return false;
  }
}
