import db from './index.js';

const setupSchema = () => {
  console.log('Setting up database schema...');

  // 1. Brands Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      hint1 TEXT NOT NULL,
      hint2 TEXT NOT NULL,
      hint3 TEXT NOT NULL,
      hint4 TEXT NOT NULL
    )
  `).run();

  // 2. Users Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // 3. Sessions Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      total_score INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      surrender_count INTEGER DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();

  // 4. Guesses Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS guesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      brand_id INTEGER NOT NULL,
      guess_text TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL,
      hints_revealed_count INTEGER NOT NULL,
      guessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY(brand_id) REFERENCES brands(id) ON DELETE CASCADE
    )
  `).run();

  console.log('Database schema set up successfully.');
};

const brandsData = [
  // --- AUTOMOBILE ---
  {
    name: 'Tesla',
    category: 'automobile',
    hint1: 'This is a modern automobile and clean energy brand.',
    hint2: 'Known for launching cars into orbit and striving to make steering wheels optional through autonomy.',
    hint3: 'In 2018, its founder famously tweeted about securing funding to go private at $420 a share, resulting in a hefty SEC fine.',
    hint4: 'Its current eccentric and controversial CEO is Elon.'
  },
  {
    name: 'Ferrari',
    category: 'automobile',
    hint1: 'This is an ultra-luxury Italian automobile brand.',
    hint2: 'Their speed demons wear a striking racing red and are adorned with a rearing black stallion.',
    hint3: 'Originally founded solely to sponsor amateur drivers, they only built road-legal cars to fund their elite Formula 1 racing team.',
    hint4: 'Its legendary founder was named Enzo.'
  },
  {
    name: 'Toyota',
    category: 'automobile',
    hint1: 'This is a massive Japanese automobile brand.',
    hint2: 'Famous for a production system that eliminated waste and cars like the Hilux that are virtually indestructible.',
    hint3: 'In the late 2000s, they faced a massive crisis and recalled millions of vehicles due to reports of unintended acceleration issues.',
    hint4: 'The brand is named after its founding family, whose first leader was Kiichiro.'
  },

  // --- SOFTWARE ---
  {
    name: 'Microsoft',
    category: 'software',
    hint1: 'This is a pioneering software and personal computing giant.',
    hint2: 'They conquered the office cubicle with a windowed interface and a suite of words, sheets, and slides.',
    hint3: 'In the late 1990s, they were sued by the US government in a landmark antitrust trial for bundling their web browser with their operating system.',
    hint4: 'Its most famous founder dropped out of Harvard and is named Bill.'
  },
  {
    name: 'Google',
    category: 'software',
    hint1: 'This is a dominant software, search, and advertising company.',
    hint2: 'Their name represents an astronomically large number, and their primary mission is to organize all of human knowledge.',
    hint3: 'They restructured under a holding parent company called Alphabet in 2015 and dropped their famous "Don\'t be evil" motto from their preface.',
    hint4: 'Its current CEO, who grew up in India and studied at IIT Kharagpur, is Sundar.'
  },
  {
    name: 'Adobe',
    category: 'software',
    hint1: 'This is a creative software and digital media giant.',
    hint2: 'They became the industry standard by letting people manipulate reality, turn fonts into vectors, and lock documents into uneditable formats.',
    hint3: 'In 2023, they mutually terminated a blockbuster $20 billion acquisition of the design platform Figma due to intense regulatory scrutiny in Europe and the US.',
    hint4: 'Its current long-standing CEO is Shantanu.'
  },

  // --- ELECTRONICS ---
  {
    name: 'Apple',
    category: 'electronics',
    hint1: 'This is a premium consumer electronics and software brand.',
    hint2: 'They designed a pocket-sized jukebox that evolved into a device that redefined how we touch, talk, and scroll.',
    hint3: 'In 2017, they admitted to chemically throttling older phones\' battery performance to prevent shutdowns, sparking a global scandal known as "Batterygate".',
    hint4: 'Its legendary co-founder, who was famous for wearing a black turtleneck and blue jeans, was Steve.'
  },
  {
    name: 'Sony',
    category: 'electronics',
    hint1: 'This is a Japanese consumer electronics and entertainment giant.',
    hint2: 'They put music in our pockets on cassette tape, and brought the ultimate gaming station into living rooms worldwide.',
    hint3: 'In 2014, their movie studio subsidiary was hit by a devastating state-sponsored cyberattack that leaked unreleased films and embarrassing executive emails.',
    hint4: 'One of its legendary co-founders, who wrote the book "Made in Japan", was Akio.'
  },
  {
    name: 'Nintendo',
    category: 'electronics',
    hint1: 'This is a historic Japanese electronics and video game brand.',
    hint2: 'They started out making handmade playing cards in 1889 before saving the global video game industry with a heroic Italian plumber.',
    hint3: 'Their hybrid home-handheld console faced class-action lawsuits over a persistent joystick drift defect in its detachable controllers.',
    hint4: 'The legendary president who guided them from cards to video games was Hiroshi.'
  },

  // --- CLOTHING ---
  {
    name: 'Nike',
    category: 'clothing',
    hint1: 'This is a major global athletic clothing and footwear brand.',
    hint2: 'Their winged goddess emblem encourages millions with a simple three-word command to take action.',
    hint3: 'In 2018, they made headlines by featuring controversial ex-NFL quarterback Colin Kaepernick in their 30th anniversary campaign.',
    hint4: 'The co-founder who started selling shoes out of the trunk of his car is Phil.'
  },
  {
    name: 'Zara',
    category: 'clothing',
    hint1: 'This is a fast-fashion clothing retail giant.',
    hint2: 'They mastered speed-to-market, turning a designer runway sketch into a store-shelf garment in under fifteen days.',
    hint3: 'The brand faced boycotts and protests in late 2023 over an advertising campaign that critics claimed resembled imagery of the conflict in Gaza.',
    hint4: 'Its secretive founder, who is one of the wealthiest self-made men in Europe, is Amancio.'
  },
  {
    name: 'Patagonia',
    category: 'clothing',
    hint1: 'This is an outdoor clothing and gear brand.',
    hint2: 'They ran a famous black Friday ad telling customers "Don\'t Buy This Jacket" to promote recycling and sustainability.',
    hint3: 'In 2022, the founder transferred 100% ownership of the multi-billion-dollar company to a trust and non-profit to fight climate change.',
    hint4: 'Its eccentric rock-climbing founder is Yvon.'
  },

  // --- COSMETICS ---
  {
    name: 'Maybelline',
    category: 'cosmetics',
    hint1: 'This is a mass-market cosmetics and makeup brand.',
    hint2: 'They are famous for their lash-lengthening mascaras and a catchy jingle questioning if beauty is born or created.',
    hint3: 'Founded in Chicago in 1915, the creator got the idea after watching his sister apply a mix of vaseline and coal dust to her eyelashes.',
    hint4: 'The brand was named after the founder\'s sister, whose name was Mabel.'
  },
  {
    name: 'MAC',
    category: 'cosmetics',
    hint1: 'This is a premium, professional-grade cosmetics brand.',
    hint2: 'Originally created as a makeup line specifically for photo shoots, they became legendary for their ultra-matte red lipstick named "Ruby Woo".',
    hint3: 'They established a revolutionary AIDS fund in 1994, donating 100% of the selling price of their special lipstick line to support people living with HIV/AIDS.',
    hint4: 'The brand was co-founded in Canada by a salon owner named Frank.'
  },
  {
    name: 'Fenty Beauty',
    category: 'cosmetics',
    hint1: 'This is a highly popular modern cosmetics brand.',
    hint2: 'They disrupted the beauty industry by launching with a ground-breaking forty-shade foundation line, forcing competitors to become more inclusive.',
    hint3: 'Their launch was named one of Time Magazine\'s best inventions of 2017 for its unprecedented inclusivity, starting the "Fenty Effect".',
    hint4: 'The brand is founded and owned by the multi-platinum Barbadian singer Rihanna (whose last name is Fenty).'
  },

  // --- JEWELRY ---
  {
    name: 'Tiffany & Co.',
    category: 'jewelry',
    hint1: 'This is a luxury jewelry and silverware brand.',
    hint2: 'Famous for a very specific, trademarked shade of robin\'s egg blue and an iconic breakfast scene outside their Manhattan flagship.',
    hint3: 'In 2021, they were acquired by the luxury conglomerate LVMH for nearly $16 billion after a bitter legal battle over pricing during the pandemic.',
    hint4: 'The company was founded in New York in 1837 by a young entrepreneur named Charles.'
  },
  {
    name: 'Cartier',
    category: 'jewelry',
    hint1: 'This is a prestigious French jewelry and watch brand.',
    hint2: 'Known as the "Jeweler of Kings" and famous for their sleek panther motif and screws-embellished "Love" bracelets.',
    hint3: 'They invented one of the earliest practical wristwatches in 1904 for a Brazilian aviator who complained about using pocket watches while flying.',
    hint4: 'The brand was founded in Paris in 1847 by Louis-Francois.'
  },
  {
    name: 'Pandora',
    category: 'jewelry',
    hint1: 'This is a Danish mass-market jewelry brand.',
    hint2: 'Famous for customizable charm bracelets that let customers carry their memories, milestones, and hobbies on their wrists.',
    hint3: 'In 2021, they announced they would stop using mined diamonds in favor of laboratory-grown gems to improve ethical standards.',
    hint4: 'It was founded as a small family jeweler in Copenhagen by Per.'
  },

  // --- ACCESSORIES ---
  {
    name: 'Ray-Ban',
    category: 'accessories',
    hint1: 'This is a premium sunglasses and eyewear brand.',
    hint2: 'They created anti-glare green lenses for US military aviators, which became a timeless pop-culture fashion symbol.',
    hint3: 'Originally owned by Bausch & Lomb, they were sold in 1999 to the Italian eyewear giant Luxottica, which now dominates the global glasses market.',
    hint4: 'They were originally commissioned in the 1930s by a US Army Air Corps Lieutenant General named John.'
  },
  {
    name: 'Rolex',
    category: 'accessories',
    hint1: 'This is an iconic Swiss luxury watch and accessory brand.',
    hint2: 'Their emblem is a crown, and their mechanical chronometers are the ultimate global currency for status and achievement.',
    hint3: 'They are owned by a private charitable trust (the Hans Wilsdorf Foundation), meaning they pay low taxes while donating massive sums to charity.',
    hint4: 'The brand was founded in London in 1905 by Hans.'
  },
  {
    name: 'Oakley',
    category: 'accessories',
    hint1: 'This is an athletic performance eyewear and accessory brand.',
    hint2: 'Known for futuristic, wrap-around sports sunglasses and protective eyewear used by top Olympians and military personnel.',
    hint3: 'In 2010, they received worldwide press for providing free protective sunglasses to the thirty-three Chilean miners trapped underground for over two months.',
    hint4: 'The founder started the company in his garage with $300, naming it after his dog, and his name is Jim.'
  },

  // --- LEATHER ---
  {
    name: 'Hermes',
    category: 'leather',
    hint1: 'This is a ultra-luxury French leather goods and fashion brand.',
    hint2: 'Their most famous leather handbags, named after a princess and an actress, are highly exclusive and require years on a waiting list.',
    hint3: 'In 2023, they faced a lawsuit from consumers claiming they antitrust-bundled the sale of their Birkin bags by requiring customers to buy other accessories first.',
    hint4: 'The brand was founded in Paris as an elite harness and saddle-making workshop by Thierry.'
  },
  {
    name: 'Coach',
    category: 'leather',
    hint1: 'This is an American modern luxury leather goods brand.',
    hint2: 'They started as a family workshop in a Manhattan loft making wallets inspired by the worn leather of a baseball glove.',
    hint3: 'In 2021, they faced severe backlash after a TikTok video showed their slashed unsold handbags in dumpsters, violating their claims of sustainability.',
    hint4: 'The brand was turned into a global powerhouse by a visionary leather craftsman named Miles.'
  },
  {
    name: 'Gucci',
    category: 'leather',
    hint1: 'This is an Italian luxury leather and fashion house.',
    hint2: 'Represented by a double-G monogram, they are famous for horsebit leather loafers and green-red-green web stripes.',
    hint3: 'In the 1990s, the family-owned business collapsed into a tragic murder-for-hire plot, where the heir was assassinated by hitmen hired by his ex-wife.',
    hint4: 'The brand was founded in Florence in 1921 by a former hotel porter named Guccio.'
  },

  // --- PLASTICS ---
  {
    name: 'Lego',
    category: 'plastics',
    hint1: 'This is a world-famous toy and plastics brand.',
    hint2: 'Their colorful interlocking ABS plastic bricks have built everything from tiny castles to full-size driveable sports cars.',
    hint3: 'In 2023, they abandoned their efforts to make bricks from recycled PET bottles because the manufacturing process actually increased carbon emissions.',
    hint4: 'The Danish carpenter who founded the company in 1932 was Ole.'
  },
  {
    name: 'Tupperware',
    category: 'plastics',
    hint1: 'This is a historic household plastics brand.',
    hint2: 'They revolutionized food preservation with a patented airtight seal inspired by the lid of a paint can, sold via neighborhood social gatherings.',
    hint3: 'In late 2024, they filed for Chapter 11 bankruptcy protection after years of struggling with debt and failing to attract younger buyers.',
    hint4: 'The company was founded by an American chemist who invented the seal, named Earl.'
  },
  {
    name: 'Rubbermaid',
    category: 'plastics',
    hint1: 'This is a large household and commercial plastics brand.',
    hint2: 'They are famous for rugged plastic storage bins, heavy-duty trash cans, and durable food containers used in home and commercial kitchens.',
    hint3: 'In 1999, the company was acquired by Newell in a multi-billion dollar merger to create a consumer goods giant, but struggled with integration.',
    hint4: 'The brand was founded in Ohio in 1920, originally making rubber dustpans, by a businessman named James.'
  },

  // --- BEAUTY ---
  {
    name: "L'Oreal",
    category: 'beauty',
    hint1: "This is the world's largest beauty and cosmetics conglomerate.",
    hint2: 'They tell their customers that they are worth it, and dominate hair dye, skincare, and fragrances globally.',
    hint3: 'For decades, their largest individual shareholder was Liliane Bettencourt, whose extreme wealth and family legal battles made constant headlines.',
    hint4: 'The brand was founded in Paris in 1909 by a young chemist who developed a safe hair dye formula, named Eugene.'
  },
  {
    name: 'Estee Lauder',
    category: 'beauty',
    hint1: 'This is a high-end beauty and skincare company.',
    hint2: 'They believe every woman can be beautiful and became famous by giving free gift-with-purchase samples to department store shoppers.',
    hint3: 'They acquired luxury scent brand Le Labo and high-end makeup lines like Tom Ford Beauty, consolidating their grip on prestige beauty.',
    hint4: 'The legendary female founder who built the empire from four basic skincare products was Estee.'
  },
  {
    name: 'Sephora',
    category: 'beauty',
    hint1: 'This is a global beauty and cosmetics retail giant.',
    hint2: 'They revolutionized cosmetics shopping by letting customers touch, swatch, and try products freely on open-sell shelves instead of behind glass counters.',
    hint3: 'Owned by the luxury conglomerate LVMH since 1997, they faced controversies over dynamic pricing and the recent phenomenon of "10-year-olds in Sephora" destroying product displays.',
    hint4: 'The visionary French entrepreneur who created the open-sell retail concept in 1970 was Dominique.'
  }
];

const seedBrands = () => {
  const rowCount = db.prepare('SELECT COUNT(*) AS count FROM brands').get();
  
  if (rowCount.count > 0) {
    console.log(`Brands table already seeded with ${rowCount.count} entries. Skipping seeding.`);
    return;
  }

  console.log('Seeding brands data...');
  const insertStmt = db.prepare(`
    INSERT INTO brands (name, category, hint1, hint2, hint3, hint4)
    VALUES (@name, @category, @hint1, @hint2, @hint3, @hint4)
  `);

  const transaction = db.transaction((brands) => {
    for (const brand of brands) {
      insertStmt.run(brand);
    }
  });

  transaction(brandsData);
  console.log(`Successfully seeded ${brandsData.length} brands into database.`);
};

try {
  setupSchema();
  seedBrands();
  console.log('Database initialization complete.');
} catch (error) {
  console.error('Error seeding database:', error);
  process.exit(1);
}
