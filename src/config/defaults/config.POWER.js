/*
Copyright 2016 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// var DisplayConfig = require('./config.display');

/**
 * Configuration options and remapping functions for the power system.
 *
 * The power system is made up of power units, which contain power supplies. Our power system is 
 * configured such that each power unit handles a 3x2 portion of the display. Each power unit 
 * contains 2 individual supplies, and each supply contains 1 AC input and 3 DC outputs,
 * 
 * The remapping functions are used for converting between display unit column / row numbers, 
 * power unit numbers, and relay numbers.
 *
 * Mod Note: You should only need to change the hardcoded numerical values here, as the rest are 
 *           calculated automatically from those values.
 */
var PowerConfig = pc = module.exports = {};

/**
 * Number of unit rows powered by a single power unit
 */
PowerConfig.unitRowsPerPowerUnit = 3;

/**
 * Number of unit columns powered by a single power unit
 */
PowerConfig.unitColsPerPowerUnit = 2;

/**
 * Number of DC outputs in a single supply
 */
PowerConfig.dcOutputsPerSupply = 3;

/**
 * Number of AC inputs in a single supply
 */
PowerConfig.acInputsPerSupply = 1;

/**
 * Number of control relays in a single supply
 */
PowerConfig.controlRelaysPerSupply = 1;
