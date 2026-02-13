"""STEM Designated Degree Program CIP codes.

A subset of the most common STEM CIP codes used by international students.
Full list: https://www.ice.gov/sites/default/files/documents/stem-list.pdf
"""

# Common STEM CIP codes and their program names
STEM_CIP_CODES = {
    "11.0101": "Computer and Information Sciences, General",
    "11.0102": "Artificial Intelligence",
    "11.0103": "Information Technology",
    "11.0104": "Informatics",
    "11.0199": "Computer and Information Sciences, Other",
    "11.0201": "Computer Programming/Programmer",
    "11.0301": "Data Processing and Data Processing Technology",
    "11.0401": "Information Science/Studies",
    "11.0501": "Computer Systems Analysis/Analyst",
    "11.0701": "Computer Science",
    "11.0802": "Data Modeling/Warehousing and Database Administration",
    "11.0901": "Computer Systems Networking and Telecommunications",
    "11.1001": "Network and System Administration/Administrator",
    "11.1003": "Computer and Information Systems Security/Auditing/Information Assurance",
    "11.1006": "Computer Systems Analysis/Cybersecurity",
    "14.0101": "Engineering, General",
    "14.0201": "Aerospace Engineering",
    "14.0501": "Bioengineering and Biomedical Engineering",
    "14.0701": "Chemical Engineering",
    "14.0801": "Civil Engineering",
    "14.0901": "Computer Engineering",
    "14.0902": "Computer Hardware Engineering",
    "14.1001": "Electrical and Electronics Engineering",
    "14.1004": "Electrical Engineering",
    "14.1201": "Engineering Physics/Applied Physics",
    "14.1301": "Engineering Science",
    "14.1401": "Environmental/Environmental Health Engineering",
    "14.1901": "Mechanical Engineering",
    "14.2001": "Metallurgical Engineering",
    "14.2701": "Systems Engineering",
    "14.3501": "Industrial Engineering",
    "14.3701": "Operations Research",
    "15.0000": "Engineering Technology, General",
    "26.0101": "Biology/Biological Sciences, General",
    "26.0102": "Biomedical Sciences, General",
    "26.0202": "Biochemistry",
    "26.0210": "Bioinformatics",
    "26.0503": "Medical Microbiology and Bacteriology",
    "26.0804": "Molecular Biology",
    "27.0101": "Mathematics, General",
    "27.0301": "Applied Mathematics",
    "27.0501": "Statistics, General",
    "27.0503": "Mathematics and Statistics",
    "27.0599": "Statistics, Other",
    "27.0601": "Applied Statistics",
    "30.0601": "Systems Science and Theory",
    "30.3001": "Computational Science",
    "30.3101": "Data Science, General",
    "30.3801": "Data Analytics, General",
    "30.7001": "Data Science",
    "40.0101": "Physical Sciences, General",
    "40.0201": "Astronomy",
    "40.0501": "Chemistry, General",
    "40.0801": "Physics, General",
    "40.0810": "Theoretical and Mathematical Physics",
    "52.1301": "Management Science",
    "52.1302": "Business Statistics",
    "52.1304": "Actuarial Science",
    "52.1399": "Management Science and Quantitative Methods, Other",
}


def is_stem_program(cip_code: str) -> bool:
    """Check if a CIP code is STEM-designated."""
    return cip_code in STEM_CIP_CODES


def get_program_name(cip_code: str) -> str | None:
    """Get the program name for a CIP code."""
    return STEM_CIP_CODES.get(cip_code)
