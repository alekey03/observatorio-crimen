/* Attribute-set aggregation preserves distinct complaints, including overlapping records. */
let snapshot;
function query(data, filters) {
    const dimensions = data.dimensions;
    const counts = {total:0, months:{}, days:{}, territories:{}, crimes:{}};
    const territoryDimension = filters.mapDepartments ? 1 : filters.province ? 3 : filters.department ? 2 : 1;
    const mapName = value => {
        const name=value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
        if (name==='REGION LIMA' || name==='LIMA METROPOLITANA') return 'LIMA';
        if (name.includes('CALLAO')) return 'CALLAO';
        return name;
    };
    const selected = [filters.department, filters.province, filters.district, filters.crime];
    const indexes = selected.map((value, i) => value ? dimensions[i + 1].indexOf(value) : -1);
    const accepted = new Uint8Array(data.facets.length);
    data.facets.forEach((facet, i) => {
        const date = dimensions[0][facet[0]];
        accepted[i] = (!filters.from || date >= filters.from) && (!filters.to || date <= filters.to) &&
            selected.every((value, k) => !value || facet[k + 1] === indexes[k]);
    });
    const increment = (object, key, count) => { object[key] = (object[key] || 0) + count; };
    data.groups.forEach(([members, count]) => {
        const matches = members.filter(index => accepted[index]);
        if (!matches.length) return;
        counts.total += count;
        const months = new Set(), days = new Set(), territories = new Set(), crimes = new Set();
        matches.forEach(index => {
            const facet = data.facets[index], date = dimensions[0][facet[0]];
            months.add(date.slice(0,7)); days.add(date);
            const territory=dimensions[territoryDimension][facet[territoryDimension]];
            territories.add(filters.mapDepartments ? mapName(territory) : territory);
            crimes.add(dimensions[4][facet[4]]);
        });
        months.forEach(key => increment(counts.months,key,count));
        days.forEach(key => increment(counts.days,key,count));
        territories.forEach(key => increment(counts.territories,key,count));
        crimes.forEach(key => increment(counts.crimes,key,count));
    });
    return counts;
}
if (typeof module !== 'undefined') module.exports = {query};
if (typeof self !== 'undefined') self.onmessage = async ({data:message}) => {
    try {
        if (message.type === 'load') {
            const response = await fetch(message.url, {cache:'no-store'});
            if (!response.ok) throw new Error('No se encontro el archivo preparado de DGIS diaria.');
            snapshot = await response.json();
            if (snapshot.schema !== 2 || !snapshot.groups.length) throw new Error('El archivo DGIS no es valido.');
            const geography = new Set(snapshot.facets.map(facet => JSON.stringify(facet.slice(1,4))));
            self.postMessage({id:message.id, metadata:snapshot.metadata, crimes:snapshot.dimensions[4], geography:[...geography].map(key => JSON.parse(key).map((index,i) => snapshot.dimensions[i+1][index]))});
        } else if (message.type === 'query') {
            if (!snapshot) throw new Error('DGIS todavia no esta cargada.');
            self.postMessage({id:message.id, result:query(snapshot,message.filters)});
        }
    } catch(error) { self.postMessage({id:message.id,error:error.message}); }
};
