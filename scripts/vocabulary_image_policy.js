// A nearby object is not a substitute for the word on a teaching card.
const withdrawn = new Map([
    ['I clean', 'The original artwork depicts a garden, not cleaning.'],
    ['I wash the container', 'Handwashing artwork does not depict washing a container.'],
    ['library', 'A shelf alone does not depict a library interior.'],
    ['minced meat', 'A whole meat cut does not depict minced meat.'],
    ['ham', 'A raw meat cut does not depict cured ham.'],
    ['box of eggs', 'An egg alone does not depict a box of eggs.'],
    ['bag of rice', 'A rice bowl does not depict a bag of rice.'],
    ['packet of pasta', 'A pasta dish does not depict a packet of pasta.'],
    ['tin of peas', 'A pea pod does not depict a tin of peas.'],
    ['box of strawberries', 'A strawberry alone does not depict a box.'],
    ['grain of rice', 'A rice bowl does not depict a single grain.'],
    ['salt grain', 'A salt shaker does not depict a single grain.'],
    ['classroom', 'A school building does not depict a classroom interior.'],
    ['class', 'A school building does not depict a class.'],
    ['bedroom', 'A bed alone does not depict a room.'],
    ['my room', 'A bed alone does not depict a room or its owner.'],
    ['room', 'A bed alone does not depict a room.'],
    ['bathroom', 'A bathtub alone does not depict a room.'],
    ['living room', 'A sofa alone does not depict a room.'],
    ['plant', 'A tree is too specific for a generic plant.'],
    ['grass / vegetables', 'Lettuce cannot illustrate both meanings.'],
    ['children', 'One child does not depict a plural group.'],
    ['their children', 'One child cannot depict a group or ownership.'],
    ['my siblings', 'One child does not depict a sibling relationship.'],
    ['parents', 'A couple alone does not establish parenthood.'],
    ['relative', 'A family group cannot identify a particular relationship.'],
    ['I lost', 'A magnifying glass depicts searching, not losing.'],
    ['I get up', 'A yawning face does not depict getting out of bed.']
]);
const searchGlosses = new Set(('square / piazza|square|corner|kitchen|dining room|corridor|throat|Blue Grotto|Muża museum|Valletta|Mdina|the Catacombs|the Inquisitor\'s Palace|Ġgantija temple complex|view / views|prinjolata dessert|cream|exhibition|clothes|clothing|mud|pole|floor|baby Jesus|neck|minced meat|ham|box of eggs|bag of rice|packet of pasta|tin of peas|box of strawberries|grain of rice|salt grain|classroom|bedroom|my room|room|bathroom|living room|plant|grass / vegetables|library').split('|'));
const familyGlosses = new Set(('husband / two [context-based]|cousin|uncle|aunt|grandson / nephew [basic use]|granddaughter / niece [basic use]|children|their children|my siblings|parents|relative').split('|'));
function missingDecision(record) {
    if (searchGlosses.has(record.english.split(' -> ')[0])) return { queue: 'needs-image', reason: /places-core/.test(record.group) ? 'Needs an accurate view of this named place, not a generic landmark icon.' : 'Concrete subject: find a literal cutout, interior scene or clearly labelled detail.' };
    if (familyGlosses.has(record.english)) return { queue: 'no-image-needed', reason: 'A labelled family relationship diagram is preferable to a standalone person icon.' };
    if (/calendar|pronoun|possessive|demonstrative|preposition|modal|comparison|adjective|quality|qualities|size|grammar|introduction|future-time/.test(record.group)) return { queue: 'no-image-needed', reason: 'Use a sentence, timeline or comparison diagram; a standalone cutout cannot convey the meaning.' };
    return { queue: 'no-image-needed', reason: 'Grammar, action, category or attribute: use contextual examples rather than an arbitrary object icon.' };
}
module.exports = { withdrawn, missingDecision };
