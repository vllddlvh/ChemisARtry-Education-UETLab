
-- Molecules: public reference data
CREATE TABLE public.molecules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formula TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'common',
  atoms JSONB NOT NULL,
  bonds JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reactants TEXT[] NOT NULL,
  products TEXT[] NOT NULL,
  equation TEXT NOT NULL,
  description TEXT NOT NULL,
  energy_kj NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  molecules_spawned INT NOT NULL DEFAULT 0,
  reactions_triggered INT NOT NULL DEFAULT 0,
  last_molecule TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.molecules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Molecules public read" ON public.molecules FOR SELECT USING (true);
CREATE POLICY "Reactions public read" ON public.reactions FOR SELECT USING (true);

CREATE POLICY "Own progress read" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own progress insert" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own progress update" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

-- Seed molecules. Atoms: [{el, x, y, z}], Bonds: [{a, b, order}]
INSERT INTO public.molecules (formula, name, description, category, atoms, bonds) VALUES
('H2O', 'Water', 'The universal solvent, essential for all known life. Bent molecular geometry with a bond angle of ~104.5°.', 'common',
  '[{"el":"O","x":0,"y":0,"z":0},{"el":"H","x":0.76,"y":0.59,"z":0},{"el":"H","x":-0.76,"y":0.59,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1},{"a":0,"b":2,"order":1}]'::jsonb),
('CO2', 'Carbon Dioxide', 'A linear triatomic molecule produced by respiration and combustion. Key greenhouse gas.', 'common',
  '[{"el":"C","x":0,"y":0,"z":0},{"el":"O","x":1.16,"y":0,"z":0},{"el":"O","x":-1.16,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":2},{"a":0,"b":2,"order":2}]'::jsonb),
('CH4', 'Methane', 'The simplest hydrocarbon and main component of natural gas. Tetrahedral geometry, 109.5° angles.', 'organic',
  '[{"el":"C","x":0,"y":0,"z":0},{"el":"H","x":0.63,"y":0.63,"z":0.63},{"el":"H","x":-0.63,"y":-0.63,"z":0.63},{"el":"H","x":-0.63,"y":0.63,"z":-0.63},{"el":"H","x":0.63,"y":-0.63,"z":-0.63}]'::jsonb,
  '[{"a":0,"b":1,"order":1},{"a":0,"b":2,"order":1},{"a":0,"b":3,"order":1},{"a":0,"b":4,"order":1}]'::jsonb),
('NH3', 'Ammonia', 'Pungent gas with trigonal pyramidal geometry. Key industrial chemical for fertilizers.', 'common',
  '[{"el":"N","x":0,"y":0,"z":0},{"el":"H","x":0.94,"y":-0.33,"z":0},{"el":"H","x":-0.47,"y":-0.33,"z":0.82},{"el":"H","x":-0.47,"y":-0.33,"z":-0.82}]'::jsonb,
  '[{"a":0,"b":1,"order":1},{"a":0,"b":2,"order":1},{"a":0,"b":3,"order":1}]'::jsonb),
('NaCl', 'Sodium Chloride', 'Common table salt. Ionic compound formed from a metal and a halogen.', 'ionic',
  '[{"el":"Na","x":-1.2,"y":0,"z":0},{"el":"Cl","x":1.2,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1}]'::jsonb),
('O2', 'Oxygen', 'Diatomic oxygen gas. Essential for cellular respiration in most organisms.', 'common',
  '[{"el":"O","x":-0.6,"y":0,"z":0},{"el":"O","x":0.6,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":2}]'::jsonb),
('H2', 'Hydrogen', 'Simplest and most abundant element in the universe. Potential clean fuel.', 'common',
  '[{"el":"H","x":-0.37,"y":0,"z":0},{"el":"H","x":0.37,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1}]'::jsonb),
('Na', 'Sodium', 'Highly reactive alkali metal. Soft silvery-white.', 'element',
  '[{"el":"Na","x":0,"y":0,"z":0}]'::jsonb, '[]'::jsonb),
('Cl2', 'Chlorine', 'Yellow-green diatomic gas. Highly reactive halogen.', 'common',
  '[{"el":"Cl","x":-0.99,"y":0,"z":0},{"el":"Cl","x":0.99,"y":0,"z":0}]'::jsonb,
  '[{"a":0,"b":1,"order":1}]'::jsonb);

-- Seed reactions
INSERT INTO public.reactions (reactants, products, equation, description, energy_kj) VALUES
(ARRAY['H2','O2'], ARRAY['H2O'], '2 H₂ + O₂ → 2 H₂O', 'Combustion of hydrogen — the classic formation of water. Highly exothermic.', -571.6),
(ARRAY['Na','Cl2'], ARRAY['NaCl'], '2 Na + Cl₂ → 2 NaCl', 'Synthesis of table salt from its elements. Violent and bright reaction.', -822.0),
(ARRAY['CH4','O2'], ARRAY['CO2','H2O'], 'CH₄ + 2 O₂ → CO₂ + 2 H₂O', 'Combustion of methane — burning natural gas releases energy.', -890.0),
(ARRAY['NH3','O2'], ARRAY['H2O'], '4 NH₃ + 3 O₂ → 2 N₂ + 6 H₂O', 'Oxidation of ammonia (simplified). Industrial precursor to nitric acid.', -1267.0),
(ARRAY['H2','Cl2'], ARRAY['NaCl'], 'H₂ + Cl₂ → 2 HCl', 'Formation of hydrogen chloride from its elements.', -184.0);
