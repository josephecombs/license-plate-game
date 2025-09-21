/**
 * State mapping constants for readable names
 */
export const STATE_NAMES = {
	'01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas', '06': 'California',
	'08': 'Colorado', '09': 'Connecticut', '10': 'Delaware', '11': 'District of Columbia',
	'12': 'Florida', '13': 'Georgia', '15': 'Hawaii', '16': 'Idaho', '17': 'Illinois',
	'18': 'Indiana', '19': 'Iowa', '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana',
	'23': 'Maine', '24': 'Maryland', '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota',
	'28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska', '32': 'Nevada',
	'33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico', '36': 'New York',
	'37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio', '40': 'Oklahoma',
	'41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island', '45': 'South Carolina',
	'46': 'South Dakota', '47': 'Tennessee', '48': 'Texas', '49': 'Utah', '50': 'Vermont',
	'51': 'Virginia', '53': 'Washington', '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming',
	'57': 'Alberta', '58': 'British Columbia', '59': 'Manitoba', '60': 'New Brunswick',
	'61': 'Newfoundland and Labrador', '62': 'Northwest Territories', '63': 'Nova Scotia',
	'64': 'Nunavut', '65': 'Ontario', '66': 'Prince Edward Island', '67': 'Quebec',
	'68': 'Saskatchewan', '69': 'Yukon',
	'70': 'Aguascalientes', '71': 'Baja California', '72': 'Baja California Sur',
	'73': 'Campeche', '74': 'Chiapas', '75': 'Chihuahua', '76': 'Coahuila de Zaragoza',
	'77': 'Colima', '78': 'Distrito Federal', '79': 'Durango', '80': 'Guanajuato',
	'81': 'Guerrero', '82': 'Hidalgo', '83': 'Jalisco', '84': 'México',
	'85': 'Michoacán de Ocampo', '86': 'Morelos', '87': 'Nayarit', '88': 'Nuevo León',
	'89': 'Oaxaca', '90': 'Puebla', '91': 'Querétaro', '92': 'Quintana Roo',
	'93': 'San Luis Potosí', '94': 'Sinaloa', '95': 'Sonora', '96': 'Tabasco',
	'97': 'Tamaulipas', '98': 'Tlaxcala', '99': 'Veracruz de Ignacio de la Llave', '100': 'Yucatán',
	'101': 'Zacatecas'
};

/**
 * State mapping constants for 2-letter codes to full names
 */
export const STATES = {
	'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
	'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'DC': 'District of Columbia',
	'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois',
	'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana',
	'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
	'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
	'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
	'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
	'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
	'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
	'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
	'AB': 'Alberta', 'BC': 'British Columbia', 'MB': 'Manitoba', 'NB': 'New Brunswick',
	'NL': 'Newfoundland and Labrador', 'NT': 'Northwest Territories', 'NS': 'Nova Scotia',
	'NU': 'Nunavut', 'ON': 'Ontario', 'PE': 'Prince Edward Island', 'QC': 'Quebec',
	'SK': 'Saskatchewan', 'YT': 'Yukon',
	'MX-AG': 'Aguascalientes', 'MX-BN': 'Baja California', 'MX-BS': 'Baja California Sur',
	'MX-CM': 'Campeche', 'MX-CS': 'Chiapas', 'MX-CH': 'Chihuahua', 'MX-CO': 'Coahuila de Zaragoza',
	'MX-CL': 'Colima', 'MX-DF': 'Distrito Federal', 'MX-DG': 'Durango', 'MX-GT': 'Guanajuato',
	'MX-GR': 'Guerrero', 'MX-HG': 'Hidalgo', 'MX-JA': 'Jalisco', 'MX-EM': 'México',
	'MX-MI': 'Michoacán de Ocampo', 'MX-MO': 'Morelos', 'MX-NA': 'Nayarit', 'MX-NL': 'Nuevo León',
	'MX-OA': 'Oaxaca', 'MX-PU': 'Puebla', 'MX-QT': 'Querétaro', 'MX-QR': 'Quintana Roo',
	'MX-SL': 'San Luis Potosí', 'MX-SI': 'Sinaloa', 'MX-SO': 'Sonora', 'MX-TB': 'Tabasco',
	'MX-TM': 'Tamaulipas', 'MX-TL': 'Tlaxcala', 'MX-VE': 'Veracruz de Ignacio de la Llave', 'MX-YU': 'Yucatán',
	'MX-ZA': 'Zacatecas'
};

/**
 * Canadian provinces mapping from long names to integer IDs
 */
export const CANADIAN_PROVINCES = {
	'Alberta': '57',
	'British Columbia': '58',
	'Manitoba': '59',
	'New Brunswick': '60',
	'Newfoundland and Labrador': '61',
	'Northwest Territories': '62',
	'Nova Scotia': '63',
	'Nunavut': '64',
	'Ontario': '65',
	'Prince Edward Island': '66',
	'Quebec': '67',
	'Saskatchewan': '68',
	'Yukon': '69'
};

/**
 * Mexican states mapping from long names to integer IDs
 */
export const MEXICAN_STATES = {
    'Aguascalientes': '70',
    'Baja California': '71',
    'Baja California Sur': '72',
    'Campeche': '73',
    'Chiapas': '74',
    'Chihuahua': '75',
    'Coahuila de Zaragoza': '76',
    'Colima': '77',
    'Durango': '78',
    'Guanajuato': '79',
    'Guerrero': '80',
    'Hidalgo': '81',
    'Jalisco': '82',
    'México': '83',
    'Distrito Federal': '84',
    'Michoacán de Ocampo': '85',
    'Morelos': '86',
    'Nayarit': '87',
    'Nuevo León': '88',
    'Oaxaca': '89',
    'Puebla': '90',
    'Querétaro': '91',
    'Quintana Roo': '92',
    'San Luis Potosí': '93',
    'Sinaloa': '94',
    'Sonora': '95',
    'Tabasco': '96',
    'Tamaulipas': '97',
    'Tlaxcala': '98',
    'Veracruz de Ignacio de la Llave': '99',
    'Yucatán': '100',
    'Zacatecas': '101'
};
