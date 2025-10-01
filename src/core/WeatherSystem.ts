/**
 * Weather System
 *
 * Manages weather effects on the battlefield.
 * Weather changes randomly every 5-8 turns.
 */

import type { WeatherEffect, WeatherType } from '../types/core';

export class WeatherSystem {
  private static readonly WEATHER_TYPES: WeatherType[] = [
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

    const type = this.WEATHER_TYPES[Math.floor(Math.random() * this.WEATHER_TYPES.length)];

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

    switch (type) {
      case 'RAIN':
        return {
          type: 'RAIN',
          attackMod: 0.9,
          defenseMod: 1.0,
          speedMod: 0.95,
          turnsRemaining: duration,
        };

      case 'STORM':
        return {
          type: 'STORM',
          attackMod: 0.8,
          defenseMod: 1.0,
          speedMod: 0.9,
          turnsRemaining: duration,
        };

      case 'FOG':
        return {
          type: 'FOG',
          attackMod: 0.85,
          defenseMod: 1.1,
          speedMod: 1.0,
          turnsRemaining: duration,
        };

      case 'SNOW':
        return {
          type: 'SNOW',
          attackMod: 1.0,
          defenseMod: 0.9,
          speedMod: 0.85,
          turnsRemaining: duration,
        };

      default:
        return {
          type: 'CLEAR',
          attackMod: 1.0,
          defenseMod: 1.0,
          speedMod: 1.0,
          turnsRemaining: 0,
        };
    }
  }

  /**
   * Get weather icon for UI
   */
  static getWeatherIcon(type: WeatherType): string {
    switch (type) {
      case 'CLEAR':
        return '☀️';
      case 'RAIN':
        return '🌧️';
      case 'STORM':
        return '⛈️';
      case 'FOG':
        return '🌫️';
      case 'SNOW':
        return '❄️';
      default:
        return '☀️';
    }
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
      default:
        return 'The weather shifts';
    }
  }

  /**
   * Get tactical advice for weather
   */
  static getWeatherTactics(type: WeatherType): string {
    switch (type) {
      case 'RAIN':
        return 'Attack power reduced. Focus on defense.';
      case 'STORM':
        return 'Heavy attack penalty. Defensive formations recommended.';
      case 'FOG':
        return 'Attack reduced but defense increased. Good for turtling.';
      case 'SNOW':
        return 'Speed greatly reduced. Plan moves carefully.';
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
