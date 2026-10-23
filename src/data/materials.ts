/**
 * Ultrasonic Material Properties Database
 * Standardized acoustic velocities, densities, acoustic impedance, and attenuation coefficients
 * derived from ASME Section V, ISO 16810, Krautkrämer, and Olympus NDT engineering reference tables.
 */

export interface MaterialProperty {
  id: string;
  name: string;
  nameAr: string;
  category: 'FERRITIC' | 'AUSTENITIC' | 'LIGHT_ALLOY' | 'HIGH_TEMP' | 'NICKEL_ALLOY' | 'NON_FERROUS' | 'CUSTOM';
  categoryLabel: string;
  categoryLabelAr: string;
  longitudinalVelocity: number; // m/s (Compression wave V_L)
  shearVelocity: number; // m/s (Transverse wave V_S)
  density: number; // g/cm³ (rho)
  acousticImpedance: number; // MRayls (Z = rho * V_L * 10^-3)
  attenuationDbPerMm: number; // dB/mm @ 5MHz nominal ultrasound frequency
  standardSpec: string; // ASME / ASTM / ISO Standard
  microstructure: string;
  microstructureAr: string;
  attenuationLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  description: string;
  descriptionAr: string;
  badgeColor: string; // Tailwind color token
}

export const WELD_MATERIALS: MaterialProperty[] = [
  {
    id: 'CARBON_STEEL',
    name: 'Carbon Steel (ASTM A106 / A36 / AISI 1020)',
    nameAr: 'صلب كربوني (ASTM A106 / A36 / AISI 1020)',
    category: 'FERRITIC',
    categoryLabel: 'Ferritic Structural Steel',
    categoryLabelAr: 'صلب كربوني إنشائي وأنابيب ضغط',
    longitudinalVelocity: 5920,
    shearVelocity: 3240,
    density: 7.85,
    acousticImpedance: 46.5,
    attenuationDbPerMm: 0.022,
    standardSpec: 'ASME Sec V / ASTM A106 Gr B / API 5L',
    microstructure: 'Fine ferrite-pearlite matrix with uniform low grain noise',
    microstructureAr: 'بنية حديدية-بيرليتية دقيقة مع ضوضاء حبيبية منخفضة ومنتظمة',
    attenuationLevel: 'LOW',
    description: 'Universal benchmark material for pipelines, pressure vessels, and structural welding. Exhibits predictable acoustic transmission and minimal scattering.',
    descriptionAr: 'المعدن المرجعي القياسي لخطوط الأنابيب وأوعية الضغط والمنشآت مع انتشار صوتي مستقر وتشتت منخفض.',
    badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-800',
  },
  {
    id: 'STAINLESS_316L',
    name: 'Stainless Steel (AISI 316L / 304 Austenitic)',
    nameAr: 'فولاذ مقاوم للصدأ (AISI 316L / 304 أوستنيتي)',
    category: 'AUSTENITIC',
    categoryLabel: 'Austenitic Stainless Steel',
    categoryLabelAr: 'فولاذ أوستنيتي مقاوم للتآكل والصدأ',
    longitudinalVelocity: 5740,
    shearVelocity: 3120,
    density: 7.98,
    acousticImpedance: 45.8,
    attenuationDbPerMm: 0.075,
    standardSpec: 'ASTM A240 / A312 / ASME Sec V Art 4',
    microstructure: 'Coarse anisotropic columnar grains with high ultrasonic scattering',
    microstructureAr: 'حبيبات بلورية عمودية خشنة متباينة الخواص تسبب تشتتاً صوتياً مرتفعاً',
    attenuationLevel: 'HIGH',
    description: 'Widely used in chemical, food, and petrochemical piping. Coarse weld dendrites produce high acoustic scattering and attenuation requiring TVG compensation.',
    descriptionAr: 'يستخدم في الصناعات الكيميائية والنفطية. تسبب الحبيبات المتشعبة في اللحام تشتتاً وتخمييداً صوتياً عالياً يتطلب تعويض TVG.',
    badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-800',
  },
  {
    id: 'ALUMINUM_6061',
    name: 'Aluminum Alloy (6061-T6 / 5083 Marine)',
    nameAr: 'سبائك ألومنيوم (6061-T6 / 5083 بحري)',
    category: 'LIGHT_ALLOY',
    categoryLabel: 'Lightweight Structural Alloy',
    categoryLabelAr: 'سبائك ألومنيوم خفيفة وفضائية وبحرية',
    longitudinalVelocity: 6320,
    shearVelocity: 3130,
    density: 2.70,
    acousticImpedance: 17.1,
    attenuationDbPerMm: 0.012,
    standardSpec: 'ASTM B209 / AWS D1.2 Structural Welding',
    microstructure: 'Homogeneous fine equiaxed grains with high ultrasonic transparency',
    microstructureAr: 'حبيبات دقيقة متجانسة ذات شفافية صوتية فائقة',
    attenuationLevel: 'LOW',
    description: 'High sound velocity and very low acoustic damping. Widely used in aerospace, shipbuilding, and automotive light structures.',
    descriptionAr: 'سرعة صوت عالية جداً وتخميد صوتي منخفض للغاية، يستخدم في هياكل الطائرات وبناء السفن والسيارات.',
    badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
  },
  {
    id: 'DUPLEX_2205',
    name: 'Duplex Stainless Steel (2205 / UNS S31803)',
    nameAr: 'فولاذ دوبلكس (2205 / UNS S31803 مزدوج)',
    category: 'AUSTENITIC',
    categoryLabel: 'Dual-Phase Austenitic-Ferritic',
    categoryLabelAr: 'فولاذ ثنائي الطور (أوستنيتي-فيريتي)',
    longitudinalVelocity: 5790,
    shearVelocity: 3150,
    density: 7.80,
    acousticImpedance: 45.2,
    attenuationDbPerMm: 0.058,
    standardSpec: 'ASTM A790 / API 6A Subsea',
    microstructure: 'Approx 50% ferrite and 50% austenite dual-phase microstructure',
    microstructureAr: 'بنية مجهرية متوازنة 50% فيريت و 50% أوستنيت',
    attenuationLevel: 'MEDIUM',
    description: 'Used in offshore oil & gas flowlines and subsea manifolds. Features dual-phase boundary reflections with moderate grain scattering.',
    descriptionAr: 'يستخدم في خطوط تدفق النفط والغاز البحرية وتحت الماء، يتميز بانعكاسات عند حدود الطورين وتشتت معتدل.',
    badgeColor: 'text-teal-400 bg-teal-950/60 border-teal-800',
  },
  {
    id: 'INCONEL_625',
    name: 'Inconel Superalloy (Alloy 625 / 718 Nickel Base)',
    nameAr: 'سبيكة إنكونيل فائقة (Alloy 625 / 718 نيكل)',
    category: 'NICKEL_ALLOY',
    categoryLabel: 'Nickel Superalloy',
    categoryLabelAr: 'سبائك النيكل الفائقة للمحطات النووية',
    longitudinalVelocity: 5820,
    shearVelocity: 3020,
    density: 8.44,
    acousticImpedance: 49.1,
    attenuationDbPerMm: 0.085,
    standardSpec: 'ASTM B443 / ASME Sec III Nuclear',
    microstructure: 'Heavy solid solution matrix with high acoustic absorption and severe scatter',
    microstructureAr: 'مصفوفة محلول صلب ثقيلة ذات امتصاص وتشتت صوتي شديد',
    attenuationLevel: 'VERY_HIGH',
    description: 'High-temperature nuclear and subsea clad welds. Extreme attenuation and acoustic impedance necessitate high-voltage pulser and low-frequency probes.',
    descriptionAr: 'تطبيقات نووية ومحركات توربينية، يتطلب تخميده الشديد نبضات طاقة عالية وترددات فحص منخفضة.',
    badgeColor: 'text-purple-400 bg-purple-950/60 border-purple-800',
  },
  {
    id: 'TITANIUM_GR5',
    name: 'Titanium Alloy (Grade 5 / Ti-6Al-4V)',
    nameAr: 'سبيكة تيتانيوم (Grade 5 / Ti-6Al-4V)',
    category: 'LIGHT_ALLOY',
    categoryLabel: 'Titanium Aerospace Alloy',
    categoryLabelAr: 'سبائك التيتانيوم عالية المقاومة',
    longitudinalVelocity: 6070,
    shearVelocity: 3125,
    density: 4.43,
    acousticImpedance: 26.9,
    attenuationDbPerMm: 0.028,
    standardSpec: 'AMS 4911 / AWS D17.1 Aerospace Fusion',
    microstructure: 'Alpha-beta dual phase with high acoustic velocity and clean propagation',
    microstructureAr: 'طور ألفا-بيتا مزدوج مع سرعة صوت عالية وانتشار نقي',
    attenuationLevel: 'LOW',
    description: 'High strength-to-density ratio used in aerospace fan blades and biomedical implants. Moderate attenuation and fast sound propagation.',
    descriptionAr: 'نسبة قوة إلى وزن استثنائية، تستخدم في شفرات الطائرات والزرعات الطبية مع تخميد منخفض وسرعة عالية.',
    badgeColor: 'text-sky-400 bg-sky-950/60 border-sky-800',
  },
  {
    id: 'CR_MO_P91',
    name: 'Low-Alloy Cr-Mo Steel (P91 / P22 / 9Cr-1Mo-V)',
    nameAr: 'صلب كروم-موليبدينوم (P91 / P22 للحرارة العالية)',
    category: 'HIGH_TEMP',
    categoryLabel: 'High-Temperature Creep Steel',
    categoryLabelAr: 'صلب حراري مقاوم للزحف للمراجل البخارية',
    longitudinalVelocity: 5890,
    shearVelocity: 3230,
    density: 7.82,
    acousticImpedance: 46.1,
    attenuationDbPerMm: 0.032,
    standardSpec: 'ASME B31.1 Power Piping / ASTM A335',
    microstructure: 'Tempered martensitic structure with fine carbide precipitates',
    microstructureAr: 'بنية مارتنزيتية معالجة حرارياً مع ترسيبات كربيدية دقيقة',
    attenuationLevel: 'LOW',
    description: 'Supercritical power plant steam headers and boiler tubes. Uniform wave velocity and low attenuation allow precise creep cavity detection.',
    descriptionAr: 'رؤوس البخار وأنابيب المراجل في محطات توليد الطاقة، تتيح سرعته المنتظمة كشف عيوب الزحف الحراري بدقة.',
    badgeColor: 'text-orange-400 bg-orange-950/60 border-orange-800',
  },
  {
    id: 'CUNI_90_10',
    name: 'Copper-Nickel Alloy (CuNi 90/10 / CDA 706)',
    nameAr: 'نحاس-نيكل بحري (CuNi 90/10 / CDA 706)',
    category: 'NON_FERROUS',
    categoryLabel: 'Marine Seawater Piping',
    categoryLabelAr: 'سبائك بحرية لمياه التبريد ومكثفات البخار',
    longitudinalVelocity: 4700,
    shearVelocity: 2330,
    density: 8.94,
    acousticImpedance: 42.0,
    attenuationDbPerMm: 0.040,
    standardSpec: 'MIL-T-16420K / ASTM B466',
    microstructure: 'Single-phase face-centered cubic with lower acoustic velocity',
    microstructureAr: 'بنية مكعبة وحيدة الطور مع سرعة صوت منخفضة نسبياً',
    attenuationLevel: 'MEDIUM',
    description: 'Marine cooling systems and offshore seawater piping. Lower shear wave velocity (2330 m/s) results in steeper refracted angles in wedgeless inspections.',
    descriptionAr: 'أنظمة التبريد بمياه البحر والمكثفات البحرية، سرعة موجه القص المنخفضة تنتج زوايا انكسار مختلفة.',
    badgeColor: 'text-yellow-400 bg-yellow-950/60 border-yellow-800',
  },
  {
    id: 'CAST_IRON',
    name: 'Ductile Cast Iron (Nodular Spheroidal)',
    nameAr: 'حديد زهر عقدي (Ductile / Nodular Cast Iron)',
    category: 'FERRITIC',
    categoryLabel: 'Foundry Cast Iron',
    categoryLabelAr: 'حديد زهر مسكوب للصمامات والمضخات',
    longitudinalVelocity: 5600,
    shearVelocity: 3000,
    density: 7.20,
    acousticImpedance: 40.3,
    attenuationDbPerMm: 0.110,
    standardSpec: 'ASTM A536 / ISO 1083',
    microstructure: 'Graphite spheroids in ferrite-pearlite matrix causing high beam attenuation',
    microstructureAr: 'عقيدات الجرافيت الكروية تسبب امتصاصاً وتشتيتاً صوتياً كبيراً',
    attenuationLevel: 'VERY_HIGH',
    description: 'Industrial pump casings and heavy valves. Graphite nodules act as acoustic dampers requiring low frequency (1-2.25 MHz) inspection.',
    descriptionAr: 'أجسام المضخات والصمامات الثقيلة، تعمل كرات الجرافيت كمخمد صوتي قوي يتطلب ترددات فحص منخفضة.',
    badgeColor: 'text-rose-400 bg-rose-950/60 border-rose-800',
  },
];

export function getMaterialById(id: string): MaterialProperty {
  const found = WELD_MATERIALS.find((m) => m.id === id);
  return found || WELD_MATERIALS[0];
}

export function getMaterialByName(name: string): MaterialProperty | undefined {
  return WELD_MATERIALS.find(
    (m) =>
      m.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(m.id.toLowerCase())
  );
}

export function getVelocityForWaveType(
  mat: MaterialProperty,
  waveType: 'SHEAR' | 'LONGITUDINAL' = 'SHEAR'
): number {
  return waveType === 'SHEAR' ? mat.shearVelocity : mat.longitudinalVelocity;
}
