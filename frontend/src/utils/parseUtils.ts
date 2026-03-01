import type { VetCase, Species, Sex } from '../types/case';

export function parseQuickFill(text: string): Partial<VetCase> {
    const result: Partial<VetCase> = {};

    // MRN: after "MRN", "MRN:", "#", or "Medical Record"
    const mrnMatch = text.match(/(?:MRN[:\s#]*|Medical\s+Record\s*#?\s*:?\s*|#\s*)([A-Za-z0-9-]+)/i);
    if (mrnMatch) result.mrn = mrnMatch[1].trim();

    // Dates: MM/DD/YYYY
    const dateMatches = text.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g);
    if (dateMatches && dateMatches.length > 0) {
        // First date is arrival date, second is DOB
        result.arrivalDate = dateMatches[0];
        if (dateMatches.length > 1) result.dateOfBirth = dateMatches[1];
    }

    // Arrival date specifically labeled
    const arrivalMatch = text.match(/(?:Arrival\s*Date|Arrived)[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (arrivalMatch) result.arrivalDate = arrivalMatch[1];

    // DOB specifically labeled
    const dobMatch = text.match(/(?:DOB|Date\s+of\s+Birth|Born)[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (dobMatch) result.dateOfBirth = dobMatch[1];

    // Pet name
    const petMatch = text.match(/(?:Patient|Pet|Name)[:\s]+([A-Za-z][A-Za-z\s'-]*?)(?:\s*[,\n]|$)/i);
    if (petMatch) result.petName = petMatch[1].trim();

    // Owner last name
    const ownerMatch = text.match(/(?:Owner|Last\s+Name)[:\s]+([A-Za-z][A-Za-z\s'-]*?)(?:\s*[,\n]|$)/i);
    if (ownerMatch) result.ownerLastName = ownerMatch[1].trim();

    // Species
    if (/\b(dog|canine)\b/i.test(text)) result.species = 'canine' as Species;
    else if (/\b(cat|feline|kitty)\b/i.test(text)) result.species = 'feline' as Species;
    else if (/\b(other|rabbit|bird|reptile|exotic)\b/i.test(text)) result.species = 'other' as Species;

    // Breed
    const breedMatch = text.match(/(?:Breed)[:\s]+([A-Za-z][A-Za-z\s'-]*?)(?:\s*[,\n]|$)/i);
    if (breedMatch) result.breed = breedMatch[1].trim();

    // Sex - check abbreviations first, then full words
    if (/\b(MN|male\s+neutered|neutered\s+male|castrated|MC)\b/i.test(text)) {
        result.sex = 'maleNeutered' as Sex;
    } else if (/\b(FS|female\s+spayed|spayed\s+female|spayed)\b/i.test(text)) {
        result.sex = 'femaleSpayed' as Sex;
    } else if (/\b(male|intact\s+male)\b/i.test(text)) {
        result.sex = 'male' as Sex;
    } else if (/\b(female|intact\s+female)\b/i.test(text)) {
        result.sex = 'female' as Sex;
    }

    // Presenting complaint
    const complaintMatch = text.match(/(?:Complaint|CC|Presenting|Chief\s+Complaint)[:\s]+(.+?)(?:\n|$)/i);
    if (complaintMatch) result.presentingComplaint = complaintMatch[1].trim();

    // Notes
    const notesMatch = text.match(/(?:Notes?)[:\s]+(.+?)(?:\n|$)/i);
    if (notesMatch) result.notes = notesMatch[1].trim();

    return result;
}
