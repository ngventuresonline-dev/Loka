-- Adds a workspace_type column to bangalore_tech_parks to differentiate
-- 'Tech Park' (multi-tenant campus), 'Coworking' (managed/serviced offices),
-- 'Business Park' (office complex), 'Office Tower' (standalone tower), and
-- 'Standalone Office' (single corporate / vendor entry).
--
-- Previously every row counted as a "tech park" — so coworking chains like
-- WeWork / BHIVE / 315Work / Awfis / Enzyme / IndiQube / Smartworks /
-- 91Springboard inflated the tech-park count for any zone (especially
-- Koramangala, which was showing 123 mixed entries).

ALTER TABLE bangalore_tech_parks ADD COLUMN IF NOT EXISTS workspace_type TEXT;
CREATE INDEX IF NOT EXISTS bangalore_tech_parks_workspace_type_idx ON bangalore_tech_parks(workspace_type);

UPDATE bangalore_tech_parks SET workspace_type =
  CASE
    -- Coworking / managed offices (highest priority — branded chains)
    WHEN name ~* '\mwework\M|\mbhive\M|315\s*work|\mawfis\M|\menzyme\M|\mindiqube\M|\msmartworks\M|91\s*springboard|\mcowrks\M|\minnov8\M|aspire\s*coworks?|\mataura\M|\mbizzhub\M|coworkindia|ebc\s*space|\mmyhq\M|\mregus\M|coworking|\mcowork\M|managed\s*office|serviced\s*office|shared\s*office' THEN 'Coworking'
    -- Tech Park (multi-tenant campus — strong brand or 'tech park' in name)
    WHEN name ~* 'tech\s*park|tech\s*village|tech\s*square|tech\s*gardens|tech\s*hub|techpark|biz\s*park|business\s*park' THEN 'Tech Park'
    WHEN name ~* '\mmanyata\M|\membassy\s*(manyata|golflinks|tech|techvillage|techsquare|tech\s*square)|\mrmz\M|\mpritech\M|\mcessna\M|\mhelios\M|\mvrindavan\M|\mbagmane\M|karle\s*town|\mitpl\M|\bbrigade\s*(magnum|metropolis|tech|gateway)|mantri\s*commercio|salarpuria\s*(touchstone|magnificia|greenage|symbiosis|knowledge)|kalyani\s*magnum|prestige\s*(atlanta|shantiniketan|technostar|trade)|\mvelankani\M|\bwtc\b|world\s*trade|dlf\s*cybercity|sobha\s*hrc|\makshay\M|cyber\s*park|eco\s*space|global\s*tech\s*village|\bsez\b|\bezone\b|\bn\s*r\s*biz' THEN 'Tech Park'
    -- Business / corporate complex
    WHEN name ~* 'business\s*centre|corporate\s*(centre|park|tower|complex)|trade\s*centre|trade\s*tower|office\s*complex|biz\s*centre' THEN 'Business Park'
    -- Standalone office tower
    WHEN name ~* '\btower\b|\bplaza\b' THEN 'Office Tower'
    -- Default — corporate/single-tenant office (Cisco / IBM / Wipro / Infosys etc.)
    ELSE 'Standalone Office'
  END
WHERE is_active = true;
