var _ = {
	async: require( "async" )
};

var reduceSpace = function reduceSpace( space, callback ){
	if( !space || !callback ){
		throw new Error( JSON.stringify( { error: "invalid parameters" } ) );
	}

	var reduceFactor = 0;
	var factorIndex = 0;
	_.async.whilst( function( ){
			return reduceFactor != space;
		},
		function( next ){
			reduceFactor = space % Math.pow( 2, ++factorIndex );
			next( );
		},
		function( error ){
			reduceFactor = space % Math.pow( 2, --factorIndex )
			callback( {
				reduceFactor: reduceFactor,
				factorIndex: factorIndex 
			} );
		} );
};

var partitionSpace = function partitionSpace( space, callback ){
	try{
		return ( function( config ){

			config = config || {};
			
			//Override callback.
			callback = config.callback || callback;
			config.callback = callback;

			//Override space value.
			space = config.space || space;

			//Crash the code because we are strict here.
			if( !space || !callback ){
				throw new Error( JSON.stringify( { error: "invalid parameters" } ) );
			}

			//Have we specified a layer count?
			config.layerCount = config.layerCount || 1;

			//Partition list.
			config.partitionList = config.partitionList || [];

			//Preserve the original previous partition data.
			config.partitionData = config.partitionData || {};

			//This is an exciting part. This attempts to clone
			//	the previous partition data OR just create something new.
			var partitionData = {
				space: space,
				columns: config.partitionData.columns,
				rows: config.partitionData.rows,
				blocks: config.partitionData.blocks,
				overflows: config.partitionData.overflows
			};

			reduceSpace( space,
				function reducedSpace( reducedData ){
					//Preserve the columns.
					partitionData.columns = partitionData.columns || Math.pow( 2, 
						Math.ceil( space / reducedData.reduceFactor ) );
					
					//Phase A partition
					partitionData.rows = Math.ceil( space / partitionData.columns );
					var initialRows = partitionData.rows;

					( partitionData.overflows = partitionData.overflows || [] )
						.push( ( partitionData.rows * partitionData.columns ) - space );

					//Phase B partition
					partitionData.blocks = Math.ceil( Math.sqrt( Math.sqrt( initialRows ) ) );
					//The blocks of today are the columns of yesterday.
					config.partitionData.columns = partitionData.blocks;

					partitionData.rows = Math.ceil( initialRows / partitionData.blocks );
					//The previous row will also adapt the next row.
					//This will be taken into consideration and testing.
					config.partitionData.rows = partitionData.rows;

					//Reality check on the rows.
					if( config.partitionData.rows <= 0 ){
						throw new Error( JSON.stringify( { 
							error: "partition is reduced too much" } ) );
					}

					//The next space.
					config.space = partitionData.rows;

					partitionData.overflows.push( ( ( partitionData.rows * partitionData.blocks ) 
						- initialRows ) * partitionData.columns );

					partitionData.overflows = partitionData.overflows
						.map( function( overflow ){
							if( overflow < 0 ){
								return 0;
							}
							return overflow;
						} );

					//This will preserve the entire map of partition.
					config.partitionList.push( partitionData );

					//Facilitates the multi-layer dynamic partitioning.
					if( !!( --config.layerCount ) ){
						config.partitionData = partitionData;
						partitionSpace( )( config );
					}else{
						callback( config.partitionList );
					}
				} );
		} );
	}catch( error ){
		callback( error );
	}
};

exports.partitionSpace = partitionSpace;
exports.reduceSpace = reduceSpace;