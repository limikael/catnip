export function createWhereClause(spec, isSubClause) {
	if (!spec.$op)
		spec.$op="and";

	let qs="";
	let vals=[];
	let first=true;
	for (let k in spec) {
		if (k[0]!="$") {
			if (!first)
			  qs+=spec.$op;

			first=false;
			let op="=";
			if (k.match(/\W+$/))
				op=k.match(/\W+$/)[0];
			let qK=k.match(/^[^\W]*/)[0];
			qs+=` \`${qK}\`${op}? `;
			vals.push(spec[k]);
		}
	}

	if (vals.length && !isSubClause)
		qs=" WHERE "+qs;

	if (spec.$limit) {
		if (Array.isArray(spec.$limit)) {
			qs+=" LIMIT ?,? ";
			vals.push(...spec.$limit)
		}

		else {
			qs+=" LIMIT ? ";
			vals.push(spec.$limit)
		}
	}

	if (spec.$order) {
		qs+=" ORDER BY "+spec.$order;
	}

	return {
		query: qs,
		vals
	};
}
