"""
Dev-only script to seed dummy contractor profiles for pagination testing.
Run from the backend/ directory:
    python seed_contractors.py
"""
from sqlmodel import Session, select
from app.core.database import engine
from app.models.domain import User, UserRole, ContractorProfile

CONTRACTORS = [
    ("Alexandru Ionescu",  "Plumbing",           45.0,  "Bucharest",  8,  "Specialised in leak repairs and full bathroom installations."),
    ("Maria Constantin",   "Electrical",         55.0,  "Cluj-Napoca", 12, "Licensed electrician, panel upgrades and smart home wiring."),
    ("George Popescu",     "Carpentry",          40.0,  "Timișoara",   6,  "Custom furniture, shelving, and wooden flooring installations."),
    ("Elena Dumitrescu",   "Painting",           30.0,  "Iași",        4,  "Interior and exterior painting, wallpaper removal and fitting."),
    ("Mihai Stancu",       "HVAC",               65.0,  "Brașov",     10,  "AC installation, servicing, and central heating systems."),
    ("Ana Marin",          "Tiling",             38.0,  "Constanța",   5,  "Bathroom and kitchen tiling, floor and wall tiles."),
    ("Vlad Georgescu",     "Landscaping",        35.0,  "Sibiu",       7,  "Garden design, lawn care, and irrigation systems."),
    ("Ioana Popa",         "Cleaning",           25.0,  "Bucharest",   3,  "Deep cleaning, post-construction cleaning, end-of-tenancy."),
    ("Radu Niculescu",     "Moving",             50.0,  "Cluj-Napoca", 9,  "Residential and office moves, packing and unpacking service."),
    ("Cristina Florescu",  "IT Support",         60.0,  "Timișoara",   11, "Home network setup, PC repair, and smart device configuration."),
    ("Bogdan Avram",       "Plumbing",           42.0,  "Iași",        6,  "Emergency call-out service, boiler repairs and water heater installs."),
    ("Laura Petrescu",     "Electrical",         52.0,  "Brașov",      8,  "EV charger installation, solar panel wiring, and fault finding."),
    ("Daniel Rusu",        "Carpentry",          45.0,  "Constanța",   7,  "Loft conversions, fitted wardrobes, and bespoke kitchen units."),
    ("Andreea Moldovan",   "Painting",           32.0,  "Sibiu",       5,  "Decorative finishes, venetian plaster, and colour consultations."),
    ("Cosmin Dinu",        "HVAC",               70.0,  "Bucharest",  14,  "Commercial and residential HVAC, ventilation, and air quality."),
    ("Simona Barbu",       "Tiling",             36.0,  "Cluj-Napoca", 4,  "Mosaic work, heated floor tile systems, and grouting repairs."),
    ("Adrian Manea",       "Landscaping",        40.0,  "Timișoara",   9,  "Tree surgery, hedge trimming, and patio/decking installation."),
    ("Raluca Stoica",      "Cleaning",           28.0,  "Iași",        2,  "Regular domestic cleaning and ironing service available weekly."),
    ("Florin Neagu",       "Moving",             55.0,  "Brașov",     11,  "Piano and antique moving specialists, full insurance included."),
    ("Teodora Vlad",       "IT Support",         58.0,  "Constanța",   6,  "CCTV installation, router setup, and remote desktop support."),
    ("Silviu Oprea",       "Plumbing",           48.0,  "Sibiu",      10,  "Underfloor heating installation and full bathroom refits."),
    ("Monica Ciobanu",     "Electrical",         50.0,  "Bucharest",   7,  "Certificate of electrical compliance, rewiring and consumer units."),
    ("Liviu Toma",         "Carpentry",          43.0,  "Cluj-Napoca", 8,  "Staircase renovation, handrail fitting, and parquet flooring."),
    ("Gabriela Luca",      "Painting",           34.0,  "Timișoara",   6,  "Commercial painting contracts and large-scale decorating teams."),
    ("Sorin Ene",          "HVAC",               68.0,  "Iași",       13,  "Heat pump installation, underfloor heating, and annual servicing."),
]


with Session(engine) as session:
    added = 0
    for i, (name, skills, rate, location, experience, bio) in enumerate(CONTRACTORS):
        email = f"seed_contractor_{i+1}@fake.invalid"
        existing = session.exec(select(User).where(User.email == email)).first()
        if existing:
            print(f"  skip {name} (already exists)")
            continue

        user = User(
            entra_id=f"seed-contractor-{i+1}",
            email=email,
            display_name=name,
            role=UserRole.contractor,
        )
        session.add(user)
        session.flush()

        profile = ContractorProfile(
            user_id=user.id,
            display_name=name,
            skills=skills,
            hourly_rate=rate,
            location=location,
            years_experience=experience,
            bio=bio,
            contact_email=email,
        )
        session.add(profile)
        added += 1

    session.commit()
    print(f"Done — added {added} dummy contractor(s).")
