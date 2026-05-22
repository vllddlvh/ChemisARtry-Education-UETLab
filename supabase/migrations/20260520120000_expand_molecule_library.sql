-- Expand the molecule library with a broad set of educational chemistry models.
-- Atoms: [{el, x, y, z}], Bonds: [{a, b, order}]
-- Coordinates are in Ångströms (approx.) and tuned for ball-and-stick rendering.

-- =====================================================================
-- MOLECULES
-- =====================================================================

-- ---------- Diatomic gases ----------
INSERT INTO public.molecules (formula, name, description, category, atoms, bonds) VALUES
('N2', 'Nitrogen', 'Inert diatomic gas making up ~78% of Earth''s atmosphere. Held together by a strong triple bond.', 'common',
  '[{"el":"N","x":-0.55,"y":0,"z":0},{"el":"N","x":0.55,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":3}]'::jsonb),
('F2', 'Fluorine', 'Pale yellow diatomic gas. Most reactive element on the periodic table.', 'common',
  '[{"el":"F","x":-0.71,"y":0,"z":0},{"el":"F","x":0.71,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1}]'::jsonb),
('Br2', 'Bromine', 'Deep red liquid that vaporises easily. One of only two liquid elements at room temperature.', 'common',
  '[{"el":"Br","x":-1.14,"y":0,"z":0},{"el":"Br","x":1.14,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1}]'::jsonb),
('I2', 'Iodine', 'Lustrous purple-black solid that sublimes to a violet gas. Used in antiseptics.', 'common',
  '[{"el":"I","x":-1.33,"y":0,"z":0},{"el":"I","x":1.33,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1}]'::jsonb)
ON CONFLICT (formula) DO NOTHING;

-- ---------- Common gases / oxides ----------
INSERT INTO public.molecules (formula, name, description, category, atoms, bonds) VALUES
('CO', 'Carbon Monoxide', 'Colourless, odourless and toxic gas with a strong triple bond between C and O.', 'common',
  '[{"el":"C","x":-0.56,"y":0,"z":0},{"el":"O","x":0.56,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":3}]'::jsonb),
('NO', 'Nitric Oxide', 'Colourless free-radical gas. An important biological signalling molecule.', 'common',
  '[{"el":"N","x":-0.58,"y":0,"z":0},{"el":"O","x":0.58,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":2}]'::jsonb),
('NO2', 'Nitrogen Dioxide', 'Reddish-brown toxic gas. A major air pollutant from combustion engines.', 'common',
  '[{"el":"N","x":0,"y":0,"z":0},{"el":"O","x":1.10,"y":0.55,"z":0},{"el":"O","x":-1.10,"y":0.55,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":2},{"a":0,"b":2,"order":1}]'::jsonb),
('SO2', 'Sulfur Dioxide', 'Pungent gas from burning sulfur. Bent geometry, key precursor to sulfuric acid.', 'common',
  '[{"el":"S","x":0,"y":0,"z":0},{"el":"O","x":1.23,"y":0.69,"z":0},{"el":"O","x":-1.23,"y":0.69,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":2},{"a":0,"b":2,"order":2}]'::jsonb),
('SO3', 'Sulfur Trioxide', 'Trigonal planar molecule. Reacts with water to form sulfuric acid.', 'common',
  '[{"el":"S","x":0,"y":0,"z":0},{"el":"O","x":1.42,"y":0,"z":0},{"el":"O","x":-0.71,"y":1.23,"z":0},{"el":"O","x":-0.71,"y":-1.23,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":2},{"a":0,"b":2,"order":2},{"a":0,"b":3,"order":2}]'::jsonb),
('H2S', 'Hydrogen Sulfide', 'Toxic gas with the smell of rotten eggs. Bent like water but with a smaller bond angle.', 'common',
  '[{"el":"S","x":0,"y":0,"z":0},{"el":"H","x":0.97,"y":0.96,"z":0},{"el":"H","x":-0.97,"y":0.96,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1},{"a":0,"b":2,"order":1}]'::jsonb),
('O3', 'Ozone', 'Bent allotrope of oxygen. Forms the protective ozone layer in the stratosphere.', 'common',
  '[{"el":"O","x":0,"y":0,"z":0},{"el":"O","x":1.13,"y":0.59,"z":0},{"el":"O","x":-1.13,"y":0.59,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":2},{"a":0,"b":2,"order":1}]'::jsonb),
('H2O2', 'Hydrogen Peroxide', 'Pale blue liquid with an O–O single bond. Used as a disinfectant and bleach.', 'common',
  '[{"el":"O","x":-0.74,"y":0,"z":0},{"el":"O","x":0.74,"y":0,"z":0},{"el":"H","x":-1.10,"y":0.95,"z":0},{"el":"H","x":1.10,"y":-0.95,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1},{"a":0,"b":2,"order":1},{"a":1,"b":3,"order":1}]'::jsonb)
ON CONFLICT (formula) DO NOTHING;

-- ---------- Hydrogen halides ----------
INSERT INTO public.molecules (formula, name, description, category, atoms, bonds) VALUES
('HCl', 'Hydrogen Chloride', 'Colourless gas; dissolves in water to form hydrochloric acid.', 'acid',
  '[{"el":"H","x":-0.64,"y":0,"z":0},{"el":"Cl","x":0.64,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1}]'::jsonb),
('HF', 'Hydrogen Fluoride', 'Highly polar gas. Aqueous solution is hydrofluoric acid which etches glass.', 'acid',
  '[{"el":"H","x":-0.46,"y":0,"z":0},{"el":"F","x":0.46,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1}]'::jsonb),
('HBr', 'Hydrogen Bromide', 'Colourless gas that fumes in moist air. Strong monoprotic acid.', 'acid',
  '[{"el":"H","x":-0.71,"y":0,"z":0},{"el":"Br","x":0.71,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1}]'::jsonb)
ON CONFLICT (formula) DO NOTHING;

-- ---------- Oxoacids ----------
INSERT INTO public.molecules (formula, name, description, category, atoms, bonds) VALUES
('H2SO4', 'Sulfuric Acid', 'Dense oily liquid. The most produced industrial chemical worldwide. Tetrahedral around sulfur.', 'acid',
  '[{"el":"S","x":0,"y":0,"z":0},{"el":"O","x":0.85,"y":0.85,"z":0.85},{"el":"O","x":-0.85,"y":-0.85,"z":0.85},{"el":"O","x":0.85,"y":-0.85,"z":-0.85},{"el":"O","x":-0.85,"y":0.85,"z":-0.85},{"el":"H","x":1.40,"y":-1.40,"z":-1.40},{"el":"H","x":-1.40,"y":1.40,"z":-1.40}]'::jsonb,
  '[{"a":0,"b":1,"order":2},{"a":0,"b":2,"order":2},{"a":0,"b":3,"order":1},{"a":0,"b":4,"order":1},{"a":3,"b":5,"order":1},{"a":4,"b":6,"order":1}]'::jsonb),
('HNO3', 'Nitric Acid', 'Strong oxidising acid with trigonal planar nitrogen.', 'acid',
  '[{"el":"N","x":0,"y":0,"z":0},{"el":"O","x":1.20,"y":0.70,"z":0},{"el":"O","x":-1.20,"y":0.70,"z":0},{"el":"O","x":0,"y":-1.40,"z":0},{"el":"H","x":0.95,"y":-1.95,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":2},{"a":0,"b":2,"order":1},{"a":0,"b":3,"order":1},{"a":3,"b":4,"order":1}]'::jsonb),
('H3PO4', 'Phosphoric Acid', 'Triprotic acid with tetrahedral phosphorus. Used in fertilisers and soft drinks.', 'acid',
  '[{"el":"P","x":0,"y":0,"z":0},{"el":"O","x":0,"y":0,"z":1.50},{"el":"O","x":1.40,"y":0,"z":-0.50},{"el":"O","x":-0.70,"y":1.21,"z":-0.50},{"el":"O","x":-0.70,"y":-1.21,"z":-0.50},{"el":"H","x":2.10,"y":0.70,"z":-0.50},{"el":"H","x":-1.05,"y":1.82,"z":0.20},{"el":"H","x":-1.05,"y":-1.82,"z":0.20}]'::jsonb,
  '[{"a":0,"b":1,"order":2},{"a":0,"b":2,"order":1},{"a":0,"b":3,"order":1},{"a":0,"b":4,"order":1},{"a":2,"b":5,"order":1},{"a":3,"b":6,"order":1},{"a":4,"b":7,"order":1}]'::jsonb),
('H2CO3', 'Carbonic Acid', 'Weak diprotic acid formed when CO2 dissolves in water. Drives ocean carbon chemistry.', 'acid',
  '[{"el":"C","x":0,"y":0,"z":0},{"el":"O","x":0,"y":1.30,"z":0},{"el":"O","x":1.20,"y":-0.65,"z":0},{"el":"O","x":-1.20,"y":-0.65,"z":0},{"el":"H","x":1.95,"y":-1.10,"z":0},{"el":"H","x":-1.95,"y":-1.10,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":2},{"a":0,"b":2,"order":1},{"a":0,"b":3,"order":1},{"a":2,"b":4,"order":1},{"a":3,"b":5,"order":1}]'::jsonb)
ON CONFLICT (formula) DO NOTHING;

-- ---------- Bases / hydroxides ----------
INSERT INTO public.molecules (formula, name, description, category, atoms, bonds) VALUES
('NaOH', 'Sodium Hydroxide', 'Caustic soda. Strong base used in soap-making and paper production.', 'ionic',
  '[{"el":"Na","x":-1.50,"y":0,"z":0},{"el":"O","x":0,"y":0,"z":0},{"el":"H","x":0.95,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1},{"a":1,"b":2,"order":1}]'::jsonb),
('KOH', 'Potassium Hydroxide', 'Caustic potash. Strong base used in batteries and biodiesel production.', 'ionic',
  '[{"el":"K","x":-1.70,"y":0,"z":0},{"el":"O","x":0,"y":0,"z":0},{"el":"H","x":0.95,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1},{"a":1,"b":2,"order":1}]'::jsonb),
('Ca(OH)2', 'Calcium Hydroxide', 'Slaked lime. Used in mortar, plaster, and to neutralise acidic soils.', 'ionic',
  '[{"el":"Ca","x":0,"y":0,"z":0},{"el":"O","x":1.80,"y":0,"z":0},{"el":"O","x":-1.80,"y":0,"z":0},{"el":"H","x":2.75,"y":0,"z":0},{"el":"H","x":-2.75,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1},{"a":0,"b":2,"order":1},{"a":1,"b":3,"order":1},{"a":2,"b":4,"order":1}]'::jsonb)
ON CONFLICT (formula) DO NOTHING;

-- ---------- Oxides ----------
INSERT INTO public.molecules (formula, name, description, category, atoms, bonds) VALUES
('CaO', 'Calcium Oxide', 'Quicklime. White crystalline solid, key ingredient in cement.', 'ionic',
  '[{"el":"Ca","x":-1.10,"y":0,"z":0},{"el":"O","x":1.10,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1}]'::jsonb),
('MgO', 'Magnesium Oxide', 'White hygroscopic solid used as a refractory and antacid.', 'ionic',
  '[{"el":"Mg","x":-1.05,"y":0,"z":0},{"el":"O","x":1.05,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1}]'::jsonb)
ON CONFLICT (formula) DO NOTHING;

-- ---------- Salts ----------
INSERT INTO public.molecules (formula, name, description, category, atoms, bonds) VALUES
('KCl', 'Potassium Chloride', 'White crystalline salt used as a salt substitute and fertiliser.', 'ionic',
  '[{"el":"K","x":-1.40,"y":0,"z":0},{"el":"Cl","x":1.40,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1}]'::jsonb),
('KI', 'Potassium Iodide', 'White salt added to table salt to prevent iodine deficiency.', 'ionic',
  '[{"el":"K","x":-1.65,"y":0,"z":0},{"el":"I","x":1.65,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1}]'::jsonb),
('NaF', 'Sodium Fluoride', 'White solid used in toothpaste and water fluoridation.', 'ionic',
  '[{"el":"Na","x":-1.10,"y":0,"z":0},{"el":"F","x":1.10,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1}]'::jsonb),
('CaCl2', 'Calcium Chloride', 'Hygroscopic salt used as a de-icer and drying agent.', 'ionic',
  '[{"el":"Ca","x":0,"y":0,"z":0},{"el":"Cl","x":1.80,"y":0,"z":0},{"el":"Cl","x":-1.80,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1},{"a":0,"b":2,"order":1}]'::jsonb),
('MgCl2', 'Magnesium Chloride', 'Used in tofu coagulation, road-salt and in magnesium metal production.', 'ionic',
  '[{"el":"Mg","x":0,"y":0,"z":0},{"el":"Cl","x":1.50,"y":0,"z":0},{"el":"Cl","x":-1.50,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1},{"a":0,"b":2,"order":1}]'::jsonb),
('AgCl', 'Silver Chloride', 'White solid that darkens on light exposure. The basis of classical photography.', 'ionic',
  '[{"el":"Ag","x":-1.30,"y":0,"z":0},{"el":"Cl","x":1.30,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1}]'::jsonb),
('CaCO3', 'Calcium Carbonate', 'Limestone, chalk and seashells. Decomposes on strong heating.', 'ionic',
  '[{"el":"Ca","x":-2.50,"y":0,"z":0},{"el":"C","x":0.50,"y":0,"z":0},{"el":"O","x":1.80,"y":0,"z":0},{"el":"O","x":-0.20,"y":1.13,"z":0},{"el":"O","x":-0.20,"y":-1.13,"z":0}]'::jsonb,
  '[{"a":0,"b":4,"order":1},{"a":1,"b":2,"order":2},{"a":1,"b":3,"order":1},{"a":1,"b":4,"order":1}]'::jsonb),
('NaHCO3', 'Sodium Bicarbonate', 'Baking soda. Releases CO2 when heated or when reacting with acids.', 'ionic',
  '[{"el":"Na","x":-3.00,"y":0,"z":0},{"el":"C","x":0,"y":0,"z":0},{"el":"O","x":1.25,"y":0,"z":0},{"el":"O","x":-0.65,"y":-1.10,"z":0},{"el":"O","x":-0.65,"y":1.10,"z":0},{"el":"H","x":-0.10,"y":-1.95,"z":0}]'::jsonb,
  '[{"a":0,"b":4,"order":1},{"a":1,"b":2,"order":2},{"a":1,"b":3,"order":1},{"a":1,"b":4,"order":1},{"a":3,"b":5,"order":1}]'::jsonb),
('Na2CO3', 'Sodium Carbonate', 'Soda ash. Used in glass-making, water softening, and household cleaning.', 'ionic',
  '[{"el":"Na","x":-2.80,"y":1.00,"z":0},{"el":"Na","x":-2.80,"y":-1.00,"z":0},{"el":"C","x":0.50,"y":0,"z":0},{"el":"O","x":1.80,"y":0,"z":0},{"el":"O","x":-0.20,"y":1.13,"z":0},{"el":"O","x":-0.20,"y":-1.13,"z":0}]'::jsonb,
  '[{"a":0,"b":4,"order":1},{"a":1,"b":5,"order":1},{"a":2,"b":3,"order":2},{"a":2,"b":4,"order":1},{"a":2,"b":5,"order":1}]'::jsonb),
('CuSO4', 'Copper(II) Sulfate', 'Blue crystalline salt of copper. Used in agriculture, electroplating and as a fungicide.', 'ionic',
  '[{"el":"Cu","x":-2.50,"y":0,"z":0},{"el":"S","x":0,"y":0,"z":0},{"el":"O","x":0.85,"y":0.85,"z":0.85},{"el":"O","x":-0.85,"y":-0.85,"z":0.85},{"el":"O","x":0.85,"y":-0.85,"z":-0.85},{"el":"O","x":-0.85,"y":0.85,"z":-0.85}]'::jsonb,
  '[{"a":0,"b":5,"order":1},{"a":1,"b":2,"order":2},{"a":1,"b":3,"order":2},{"a":1,"b":4,"order":1},{"a":1,"b":5,"order":1}]'::jsonb),
('FeCl3', 'Iron(III) Chloride', 'Dark green/black solid, yellow in solution. Used in water treatment and etching circuit boards.', 'ionic',
  '[{"el":"Fe","x":0,"y":0,"z":0},{"el":"Cl","x":2.00,"y":0,"z":0},{"el":"Cl","x":-1.00,"y":1.73,"z":0},{"el":"Cl","x":-1.00,"y":-1.73,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1},{"a":0,"b":2,"order":1},{"a":0,"b":3,"order":1}]'::jsonb),
('NH4Cl', 'Ammonium Chloride', 'White crystalline salt. Sublimes on heating, used in soldering flux and dry-cell batteries.', 'ionic',
  '[{"el":"N","x":0,"y":0,"z":0},{"el":"H","x":0.63,"y":0.63,"z":0.63},{"el":"H","x":-0.63,"y":-0.63,"z":0.63},{"el":"H","x":-0.63,"y":0.63,"z":-0.63},{"el":"H","x":0.63,"y":-0.63,"z":-0.63},{"el":"Cl","x":2.50,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1},{"a":0,"b":2,"order":1},{"a":0,"b":3,"order":1},{"a":0,"b":4,"order":1},{"a":0,"b":5,"order":1}]'::jsonb),
('CuO', 'Copper(II) Oxide', 'Black solid formed when copper is heated in air. Used as a pigment and in batteries.', 'ionic',
  '[{"el":"Cu","x":-1.10,"y":0,"z":0},{"el":"O","x":1.10,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1}]'::jsonb)
ON CONFLICT (formula) DO NOTHING;

-- ---------- Pure metals (single atoms) ----------
INSERT INTO public.molecules (formula, name, description, category, atoms, bonds) VALUES
('K', 'Potassium', 'Soft silvery alkali metal. Reacts violently with water producing a lilac flame.', 'element',
  '[{"el":"K","x":0,"y":0,"z":0}]'::jsonb, '[]'::jsonb),
('Mg', 'Magnesium', 'Light silvery-white metal. Burns with a brilliant white flame.', 'element',
  '[{"el":"Mg","x":0,"y":0,"z":0}]'::jsonb, '[]'::jsonb),
('Ca', 'Calcium', 'Reactive alkaline-earth metal. Essential for bones, teeth and muscle function.', 'element',
  '[{"el":"Ca","x":0,"y":0,"z":0}]'::jsonb, '[]'::jsonb),
('Fe', 'Iron', 'Most-used metal on Earth. Reddens with rust when exposed to oxygen and moisture.', 'element',
  '[{"el":"Fe","x":0,"y":0,"z":0}]'::jsonb, '[]'::jsonb),
('Cu', 'Copper', 'Reddish ductile metal with very high electrical conductivity.', 'element',
  '[{"el":"Cu","x":0,"y":0,"z":0}]'::jsonb, '[]'::jsonb),
('C', 'Carbon', 'Backbone of all organic chemistry. Exists as graphite, diamond, fullerenes and more.', 'element',
  '[{"el":"C","x":0,"y":0,"z":0}]'::jsonb, '[]'::jsonb)
ON CONFLICT (formula) DO NOTHING;

-- ---------- Hydrocarbons ----------
INSERT INTO public.molecules (formula, name, description, category, atoms, bonds) VALUES
('C2H6', 'Ethane', 'Simple two-carbon alkane. Second most abundant component of natural gas after methane.', 'organic',
  '[{"el":"C","x":-0.77,"y":0,"z":0},{"el":"C","x":0.77,"y":0,"z":0},{"el":"H","x":-1.20,"y":1.02,"z":0},{"el":"H","x":-1.20,"y":-0.51,"z":0.88},{"el":"H","x":-1.20,"y":-0.51,"z":-0.88},{"el":"H","x":1.20,"y":-1.02,"z":0},{"el":"H","x":1.20,"y":0.51,"z":0.88},{"el":"H","x":1.20,"y":0.51,"z":-0.88}]'::jsonb,
  '[{"a":0,"b":1,"order":1},{"a":0,"b":2,"order":1},{"a":0,"b":3,"order":1},{"a":0,"b":4,"order":1},{"a":1,"b":5,"order":1},{"a":1,"b":6,"order":1},{"a":1,"b":7,"order":1}]'::jsonb),
('C2H4', 'Ethylene', 'Planar alkene with a C=C double bond. The most-produced organic feedstock for plastics.', 'organic',
  '[{"el":"C","x":-0.67,"y":0,"z":0},{"el":"C","x":0.67,"y":0,"z":0},{"el":"H","x":-1.24,"y":0.93,"z":0},{"el":"H","x":-1.24,"y":-0.93,"z":0},{"el":"H","x":1.24,"y":0.93,"z":0},{"el":"H","x":1.24,"y":-0.93,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":2},{"a":0,"b":2,"order":1},{"a":0,"b":3,"order":1},{"a":1,"b":4,"order":1},{"a":1,"b":5,"order":1}]'::jsonb),
('C2H2', 'Acetylene', 'Linear alkyne with a C≡C triple bond. Burns in oxygen to give the hottest common flame.', 'organic',
  '[{"el":"C","x":-0.60,"y":0,"z":0},{"el":"C","x":0.60,"y":0,"z":0},{"el":"H","x":-1.66,"y":0,"z":0},{"el":"H","x":1.66,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":3},{"a":0,"b":2,"order":1},{"a":1,"b":3,"order":1}]'::jsonb),
('C3H8', 'Propane', 'Three-carbon alkane used as fuel for grills and heating.', 'organic',
  '[{"el":"C","x":-1.27,"y":0.43,"z":0},{"el":"C","x":0,"y":-0.43,"z":0},{"el":"C","x":1.27,"y":0.43,"z":0},{"el":"H","x":0,"y":-0.43,"z":1.00},{"el":"H","x":0,"y":-0.43,"z":-1.00},{"el":"H","x":-2.20,"y":-0.10,"z":0},{"el":"H","x":-1.20,"y":1.10,"z":0.88},{"el":"H","x":-1.20,"y":1.10,"z":-0.88},{"el":"H","x":2.20,"y":-0.10,"z":0},{"el":"H","x":1.20,"y":1.10,"z":0.88},{"el":"H","x":1.20,"y":1.10,"z":-0.88}]'::jsonb,
  '[{"a":0,"b":1,"order":1},{"a":1,"b":2,"order":1},{"a":1,"b":3,"order":1},{"a":1,"b":4,"order":1},{"a":0,"b":5,"order":1},{"a":0,"b":6,"order":1},{"a":0,"b":7,"order":1},{"a":2,"b":8,"order":1},{"a":2,"b":9,"order":1},{"a":2,"b":10,"order":1}]'::jsonb),
('C6H6', 'Benzene', 'Aromatic hexagonal ring with delocalised electrons. Foundation of aromatic chemistry.', 'organic',
  '[{"el":"C","x":1.40,"y":0,"z":0},{"el":"C","x":0.70,"y":1.21,"z":0},{"el":"C","x":-0.70,"y":1.21,"z":0},{"el":"C","x":-1.40,"y":0,"z":0},{"el":"C","x":-0.70,"y":-1.21,"z":0},{"el":"C","x":0.70,"y":-1.21,"z":0},{"el":"H","x":2.49,"y":0,"z":0},{"el":"H","x":1.245,"y":2.16,"z":0},{"el":"H","x":-1.245,"y":2.16,"z":0},{"el":"H","x":-2.49,"y":0,"z":0},{"el":"H","x":-1.245,"y":-2.16,"z":0},{"el":"H","x":1.245,"y":-2.16,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":2},{"a":1,"b":2,"order":1},{"a":2,"b":3,"order":2},{"a":3,"b":4,"order":1},{"a":4,"b":5,"order":2},{"a":5,"b":0,"order":1},{"a":0,"b":6,"order":1},{"a":1,"b":7,"order":1},{"a":2,"b":8,"order":1},{"a":3,"b":9,"order":1},{"a":4,"b":10,"order":1},{"a":5,"b":11,"order":1}]'::jsonb)
ON CONFLICT (formula) DO NOTHING;

-- ---------- Alcohols, aldehydes, carboxylic acids ----------
INSERT INTO public.molecules (formula, name, description, category, atoms, bonds) VALUES
('CH3OH', 'Methanol', 'Simplest alcohol. Toxic but valuable as a fuel and chemical feedstock.', 'organic',
  '[{"el":"C","x":0,"y":0,"z":0},{"el":"O","x":1.40,"y":0,"z":0},{"el":"H","x":1.96,"y":0.78,"z":0},{"el":"H","x":-0.36,"y":1.03,"z":0},{"el":"H","x":-0.36,"y":-0.51,"z":0.89},{"el":"H","x":-0.36,"y":-0.51,"z":-0.89}]'::jsonb,
  '[{"a":0,"b":1,"order":1},{"a":1,"b":2,"order":1},{"a":0,"b":3,"order":1},{"a":0,"b":4,"order":1},{"a":0,"b":5,"order":1}]'::jsonb),
('C2H5OH', 'Ethanol', 'Alcohol in beverages. Also a renewable biofuel.', 'organic',
  '[{"el":"C","x":-1.50,"y":-0.20,"z":0},{"el":"C","x":0,"y":0.20,"z":0},{"el":"O","x":0.70,"y":1.41,"z":0},{"el":"H","x":1.65,"y":1.41,"z":0},{"el":"H","x":-1.95,"y":0.78,"z":0.88},{"el":"H","x":-1.95,"y":0.78,"z":-0.88},{"el":"H","x":-1.95,"y":-1.20,"z":0},{"el":"H","x":0.45,"y":-0.38,"z":0.88},{"el":"H","x":0.45,"y":-0.38,"z":-0.88}]'::jsonb,
  '[{"a":0,"b":1,"order":1},{"a":1,"b":2,"order":1},{"a":2,"b":3,"order":1},{"a":0,"b":4,"order":1},{"a":0,"b":5,"order":1},{"a":0,"b":6,"order":1},{"a":1,"b":7,"order":1},{"a":1,"b":8,"order":1}]'::jsonb),
('CH3COOH', 'Acetic Acid', 'Sour-tasting acid found in vinegar. The simplest carboxylic acid after formic.', 'organic',
  '[{"el":"C","x":-1.50,"y":0,"z":0},{"el":"C","x":0,"y":0,"z":0},{"el":"O","x":0.50,"y":1.30,"z":0},{"el":"O","x":0.85,"y":-1.10,"z":0},{"el":"H","x":1.78,"y":-1.20,"z":0},{"el":"H","x":-2.00,"y":0.95,"z":0},{"el":"H","x":-2.00,"y":-0.50,"z":0.85},{"el":"H","x":-2.00,"y":-0.50,"z":-0.85}]'::jsonb,
  '[{"a":0,"b":1,"order":1},{"a":1,"b":2,"order":2},{"a":1,"b":3,"order":1},{"a":3,"b":4,"order":1},{"a":0,"b":5,"order":1},{"a":0,"b":6,"order":1},{"a":0,"b":7,"order":1}]'::jsonb),
('CH2O', 'Formaldehyde', 'Simplest aldehyde. Used as a preservative and resin precursor.', 'organic',
  '[{"el":"C","x":0,"y":0,"z":0},{"el":"O","x":1.20,"y":0,"z":0},{"el":"H","x":-0.55,"y":0.95,"z":0},{"el":"H","x":-0.55,"y":-0.95,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":2},{"a":0,"b":2,"order":1},{"a":0,"b":3,"order":1}]'::jsonb)
ON CONFLICT (formula) DO NOTHING;

-- =====================================================================
-- REACTIONS
-- =====================================================================

INSERT INTO public.reactions (reactants, products, equation, description, energy_kj) VALUES
(ARRAY['HCl','NaOH'], ARRAY['NaCl','H2O'], 'HCl + NaOH → NaCl + H₂O',
  'Classic strong-acid / strong-base neutralisation producing salt and water.', -57.6),
(ARRAY['CaCO3'], ARRAY['CaO','CO2'], 'CaCO₃ → CaO + CO₂',
  'Thermal decomposition of limestone. Endothermic; the basis of cement and lime production.', 178.0),
(ARRAY['H2O2'], ARRAY['H2O','O2'], '2 H₂O₂ → 2 H₂O + O₂',
  'Disproportionation of hydrogen peroxide, accelerated by catalysts like MnO₂ or catalase.', -196.4),
(ARRAY['CaO','H2O'], ARRAY['Ca(OH)2'], 'CaO + H₂O → Ca(OH)₂',
  'Slaking of quicklime — vigorously exothermic and used to make mortar.', -63.7),
(ARRAY['N2','H2'], ARRAY['NH3'], 'N₂ + 3 H₂ → 2 NH₃',
  'Haber–Bosch process. Industrial production of ammonia at high pressure and temperature.', -92.0),
(ARRAY['C2H4','H2'], ARRAY['C2H6'], 'C₂H₄ + H₂ → C₂H₆',
  'Catalytic hydrogenation of ethylene to ethane over a Pt or Ni surface.', -136.3),
(ARRAY['C2H5OH','O2'], ARRAY['CO2','H2O'], 'C₂H₅OH + 3 O₂ → 2 CO₂ + 3 H₂O',
  'Complete combustion of ethanol. Powers many bioethanol-fuelled engines.', -1367.0),
(ARRAY['Mg','O2'], ARRAY['MgO'], '2 Mg + O₂ → 2 MgO',
  'Burning magnesium ribbon — produces a brilliant white flame and white MgO ash.', -1204.0),
(ARRAY['SO2','O2'], ARRAY['SO3'], '2 SO₂ + O₂ → 2 SO₃',
  'Catalytic oxidation step of the contact process for making sulfuric acid.', -198.0),
(ARRAY['NaHCO3'], ARRAY['Na2CO3','H2O','CO2'], '2 NaHCO₃ → Na₂CO₃ + H₂O + CO₂',
  'Decomposition of baking soda on heating; releases CO₂ used in baking.', 91.6),
(ARRAY['CO','H2'], ARRAY['CH3OH'], 'CO + 2 H₂ → CH₃OH',
  'Industrial synthesis of methanol from syngas using a Cu/ZnO catalyst.', -90.6),
(ARRAY['SO3','H2O'], ARRAY['H2SO4'], 'SO₃ + H₂O → H₂SO₄',
  'Final step of the contact process — produces concentrated sulfuric acid.', -132.5),
(ARRAY['Fe','HCl'], ARRAY['FeCl3','H2'], '2 Fe + 6 HCl → 2 FeCl₃ + 3 H₂',
  'Iron metal dissolving in concentrated HCl, releasing hydrogen gas.', -169.0),
(ARRAY['C2H2','H2'], ARRAY['C2H6'], 'C₂H₂ + 2 H₂ → C₂H₆',
  'Hydrogenation of acetylene all the way to ethane.', -311.4),
(ARRAY['HF','NaOH'], ARRAY['NaF','H2O'], 'HF + NaOH → NaF + H₂O',
  'Neutralisation of hydrofluoric acid with sodium hydroxide.', -68.6),
(ARRAY['Ca','O2'], ARRAY['CaO'], '2 Ca + O₂ → 2 CaO',
  'Calcium burns in air with a bright orange-red flame to give calcium oxide.', -1270.0),
(ARRAY['HCl','NH3'], ARRAY['NH4Cl'], 'HCl + NH₃ → NH₄Cl',
  'Acid-base reaction producing solid ammonium chloride smoke.', -176.0),
(ARRAY['Cu','O2'], ARRAY['CuO'], '2 Cu + O₂ → 2 CuO',
  'Copper tarnishes in air on heating to form black copper(II) oxide.', -157.0);
