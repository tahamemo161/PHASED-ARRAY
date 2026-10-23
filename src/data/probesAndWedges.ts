/**
 * Industrial NDT Probes, Wedges and Specimen Presets
 * Olympus / Evident standard catalog specifications
 */

import { ProbeConfig, WedgeConfig, SpecimenConfig } from '../types/paut';

export const STANDARD_PROBES: ProbeConfig[] = [
  {
    id: '5L16-A10',
    name: '5L16-A10 (Olympus)',
    type: 'PA',
    frequency: 5.0, // MHz
    elementCount: 16,
    pitch: 0.6, // mm
    elevation: 10.0, // mm
    connector: 'IPEX_128',
    serialNumber: 'OLY-782194',
    elements: Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      active: true,
      impedance: 49.5 + (Math.sin(i * 1.2) * 1.8),
      status: 'good',
      relativeGain: 0.0,
    })),
  },
  {
    id: '5L64-A12',
    name: '5L64-A12 Wide Aperture (Olympus)',
    type: 'PA',
    frequency: 5.0, // MHz
    elementCount: 64,
    pitch: 0.6, // mm
    elevation: 10.0, // mm
    connector: 'IPEX_128',
    serialNumber: 'OLY-904122',
    elements: Array.from({ length: 64 }, (_, i) => ({
      id: i + 1,
      active: i !== 31, // simulate 1 known dead element on element 32 for realistic diagnostics!
      impedance: i === 31 ? 999 : 50.1 + (Math.cos(i * 0.8) * 1.5),
      status: i === 31 ? 'dead' : (i === 12 ? 'weak' : 'good'),
      relativeGain: i === 12 ? -3.5 : 0.0,
    })),
  },
  {
    id: '2.25L32-A2',
    name: '2.25L32-A2 Thick Section (Olympus)',
    type: 'PA',
    frequency: 2.25, // MHz
    elementCount: 32,
    pitch: 0.75, // mm
    elevation: 12.0, // mm
    connector: 'IPEX_128',
    serialNumber: 'OLY-451208',
    elements: Array.from({ length: 32 }, (_, i) => ({
      id: i + 1,
      active: true,
      impedance: 50.8 + (Math.sin(i) * 1.2),
      status: 'good',
      relativeGain: 0.0,
    })),
  },
  {
    id: '7.5L64-NW1',
    name: '7.5L64-NW1 Near-Wall High Res',
    type: 'PA',
    frequency: 7.5,
    elementCount: 64,
    pitch: 0.4,
    elevation: 7.0,
    connector: 'IPEX_128',
    serialNumber: 'OLY-661903',
    elements: Array.from({ length: 64 }, (_, i) => ({
      id: i + 1,
      active: true,
      impedance: 51.2 + (Math.cos(i) * 1.4),
      status: 'good',
      relativeGain: 0.0,
    })),
  },
  {
    id: 'TOFD-5MHz-PAIR',
    name: 'TOFD 5MHz Crystal Pair (Tx/Rx)',
    type: 'TOFD',
    frequency: 5.0,
    elementCount: 2,
    pitch: 0.0,
    elevation: 6.0,
    connector: 'LEMO_00',
    serialNumber: 'OLY-TFD-331',
    elements: [
      { id: 1, active: true, impedance: 50.0, status: 'good', relativeGain: 0 },
      { id: 2, active: true, impedance: 50.0, status: 'good', relativeGain: 0 },
    ],
  },
];

export const STANDARD_WEDGES: WedgeConfig[] = [
  {
    id: 'SA10-N55S',
    name: 'SA10-N55S (55° Shear in Steel)',
    nominalAngle: 55, // deg
    roofAngle: 0,
    velocity: 2330, // m/s (Rexolite)
    heightFirstElement: 8.5, // mm
    indexOffset: 16.0, // mm
    length: 32.0,
    width: 25.0,
    waveType: 'SHEAR',
  },
  {
    id: 'SA12-N60S',
    name: 'SA12-N60S (60° Shear in Steel)',
    nominalAngle: 60,
    roofAngle: 0,
    velocity: 2330,
    heightFirstElement: 10.2,
    indexOffset: 20.0,
    length: 38.0,
    width: 28.0,
    waveType: 'SHEAR',
  },
  {
    id: 'SA10-0L',
    name: 'SA10-0L (0° Longitudinal Flat Delay)',
    nominalAngle: 0,
    roofAngle: 0,
    velocity: 2330,
    heightFirstElement: 12.0,
    indexOffset: 12.0,
    length: 30.0,
    width: 25.0,
    waveType: 'LONGITUDINAL',
  },
  {
    id: 'STOF-60',
    name: 'STOF-60 (TOFD 60° Longitudinal Wedge)',
    nominalAngle: 60,
    roofAngle: 0,
    velocity: 2330,
    heightFirstElement: 7.0,
    indexOffset: 10.0,
    length: 22.0,
    width: 20.0,
    waveType: 'LONGITUDINAL',
  },
];

export const DEFAULT_SPECIMEN: SpecimenConfig = {
  type: 'butt_weld',
  name: 'Standard V-Groove Weld Plate (20mm Steel)',
  material: 'Carbon Steel (ASTM A106 / A36 / AISI 1020)',
  materialKey: 'CARBON_STEEL',
  longitudinalVelocity: 5920, // m/s
  shearVelocity: 3240, // m/s
  density: 7.85,
  acousticImpedance: 46.5,
  attenuationDbPerMm: 0.022,
  thickness: 20.0, // mm
  length: 250.0, // mm scan length
  width: 160.0, // mm
  bevelAngle: 30.0, // 30° bevel = 60° included angle
  rootFace: 1.5, // mm
  rootGap: 2.5, // mm
  capWidth: 18.0, // mm
  capHeight: 1.8, // mm
  flaws: [
    {
      id: 'flaw-1',
      name: 'Root Crack (Discontinuity at Weld Root)',
      type: 'root_crack',
      xOffset: 0.5, // 0.5mm from weld center
      yPosition: 65.0, // at scan pos 65mm
      depth: 19.2, // 19.2mm deep (near 20mm backwall root)
      length: 18.0, // 18mm long crack along scan axis
      height: 2.8, // 2.8mm tall through-thickness
      orientationAngle: 85.0, // almost vertical crack
      reflectivity: 1.25,
      description: 'Sharp vertical root cracking indication, high corner reflection',
    },
    {
      id: 'flaw-2',
      name: 'Lack of Sidewall Fusion (LOF)',
      type: 'lack_of_fusion',
      xOffset: -4.5, // on the left bevel line
      yPosition: 140.0, // at scan pos 140mm
      depth: 11.5, // mid-wall depth
      length: 24.0, // 24mm long along weld
      height: 3.5,
      orientationAngle: 30.0, // aligned with 30° weld bevel!
      reflectivity: 1.4,
      description: 'Planar lack of fusion along 30° sidewall bevel face',
    },
    {
      id: 'flaw-3',
      name: 'Slag Inclusion in Fill Pass',
      type: 'slag_inclusion',
      xOffset: 3.0,
      yPosition: 195.0,
      depth: 7.5,
      length: 8.0,
      height: 1.8,
      orientationAngle: 15.0,
      reflectivity: 0.85,
      description: 'Volumetric slag entrapment between pass 3 and 4',
    },
  ],
};

export const CALIBRATION_BLOCK_V1: SpecimenConfig = {
  type: 'v1_block',
  name: 'Standard Calibration Block V1 (IIW Type 1)',
  material: 'Carbon Steel (EN 12223 / ISO 2400)',
  longitudinalVelocity: 5920,
  shearVelocity: 3240,
  density: 7.85,
  thickness: 25.0,
  length: 300.0,
  width: 100.0,
  bevelAngle: 0,
  rootFace: 0,
  rootGap: 0,
  capWidth: 0,
  capHeight: 0,
  flaws: [
    {
      id: 'v1-radius-100',
      name: '100mm Curved Radius Surface',
      type: 'sdh_cal_hole',
      xOffset: 0,
      yPosition: 50,
      depth: 25.0,
      length: 25.0,
      height: 2.0,
      orientationAngle: 0,
      reflectivity: 1.5,
      description: 'R100 curved acoustic reflector for velocity & delay calibration',
    },
    {
      id: 'v1-hole-1.5',
      name: '1.5mm SDH Reference Hole (Depth 15mm)',
      type: 'sdh_cal_hole',
      xOffset: 0,
      yPosition: 150,
      depth: 15.0,
      length: 25.0,
      height: 1.5,
      orientationAngle: 0,
      reflectivity: 1.1,
      description: '1.5mm diameter side-drilled hole for sensitivity and focal resolution',
    },
  ],
};

export const PIPE_WELD_SPECIMEN: SpecimenConfig = {
  type: 'pipe_weld',
  name: '6-inch Schedule 80 Pipe Weld (OD 168.3mm, Wall 11mm)',
  material: 'Carbon Steel API 5L X52',
  longitudinalVelocity: 5920,
  shearVelocity: 3240,
  density: 7.85,
  thickness: 11.0,
  length: 530.0, // circumference ~528mm
  width: 100.0,
  bevelAngle: 37.5,
  rootFace: 1.2,
  rootGap: 2.0,
  capWidth: 14.0,
  capHeight: 1.5,
  flaws: [
    {
      id: 'pipe-flaw-1',
      name: 'Incomplete Root Penetration (LOP)',
      type: 'root_crack',
      xOffset: 0.0,
      yPosition: 120.0,
      depth: 10.4,
      length: 35.0,
      height: 1.6,
      orientationAngle: 90.0,
      reflectivity: 1.3,
      description: 'Lack of penetration along root pass for 35mm length',
    },
    {
      id: 'pipe-flaw-2',
      name: 'Porosity Cluster',
      type: 'porosity_cluster',
      xOffset: 2.0,
      yPosition: 280.0,
      depth: 5.5,
      length: 12.0,
      height: 2.2,
      orientationAngle: 0,
      reflectivity: 0.75,
      description: 'Gas pores cluster in capping pass',
    },
  ],
};
