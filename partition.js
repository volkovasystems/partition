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
	/*
		Partition Model
		
		The partition model is generated using this function partitionSpace( )

		The partition model represents how the space is divided such that the
			division implies optimal processing.

		This function employs reduction. By getting the highest reducing factor
			such that when this factor is divided to the space we can get
			the highest reduced space. The index used to reduce the space will
			also be used as a catalyst for further reduction.
	*/
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
				fileName: config.fileName,
				space: space,
				columns: config.partitionData.columns,
				rows: config.partitionData.rows,
				blocks: config.partitionData.blocks,
				overflows: config.partitionData.overflows
			};

			//Only the head partition data contains the filename.
			delete config.fileName;

			reduceSpace( space,
				function reducedSpace( reducedData ){
					//Preserve the columns.
					//I added the reduction multiplier here to balance everything.
					//I'm thinking of putting a switch on the reduction multiplier.
					partitionData.columns = partitionData.columns || Math.pow( 2, 
						Math.ceil( space / reducedData.reduceFactor ) ) 
						* ( ( config.noReductionMultiplier 
							&& typeof config.noReductionMultiplier == "boolean" )?
								1 : reducedData.factorIndex );

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
						callback( new Error( JSON.stringify( { 
							error: "partition is reduced too much" } ) ) );
						return;
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
						//Another reality check on the space.
						var currentSpace = partitionData.rows * 
							partitionData.columns * partitionData.blocks;						

						if( currentSpace > config.space ){
							callback( config.partitionList );
							return;
						}

						config.partitionData = partitionData;
						partitionSpace( )( config );
						return;
					}
					
					callback( config.partitionList );
				} );
		} );
	}catch( error ){
		return ( ( callback && callback( error ) ) || error );
	}
};

var partitionScheme = function partitionScheme( schemeType, partitionList, callback ){
	/*
		We offer different schemes here. We have to take note that
			partition will only take numerical spaces.

		The mode of communication will therefore be in string format.
		Strings can be a representation of hexadecimal or decimal numbers.
		Most of the strings can be in JSON format.

		Take note also that this schematic only offers the processing structure
			of the partition model.

		The schematic will support the following schemes:
			[1] Server processing (dedicated/NodeJS) [dedicated-server]
			[2] Local thread processing (dedicated/Java) [dedicated-thread]
			[3] Cloud processing (mixed/REST) [mixed-cloud]
			[4] Multi-platform Local Processing (mixed/Socket/REST) [mixed-platform]

		There are two types of schemes:
			[1] Dedicated
				Single type of processor.
			[2] Mixed
				Multi flow and different type of processor.

		Schematic Plan Model
			The model includes the following:
			[*] The type of scheme.
			[*] The resources needed for the chosen scheme type.

			[dedicated-server] Resources
			[1] The addresses to forward the data.
				Note that these addresses should have strict support for partitioning.

			Example:
				{
					uid: "this will be used as schematic reference",
					hash: "this will be used to verify the schematic model",
					layers: [], //partition list
					addresses: [
						"http://host:port",
						"host:port",
						"port"
						...
					]
				}

			[dedicated-thread] Resources
			[1] The partition model.
			[2] Maximum number of threads (optional)
			[3] Piped and/or forced.
				By default, multi-threading will be forced. It means that all threads
					will run at almost the same time. This has one big potential
					drawback regarding memory consumptions. So the user is free to use
					the piped mode wherein threads are executed in asynchronous schedules.
					The piped mode is slower that forced mode.

				Combining piped and forced depends on the partition model.

			Example:
				{
					uid: "",
					hash: "",
					layers: [],
					count: 0,
					piped: true,
					forced: true
				}

		Server processing via NodeJS/REST
			The following endpoints must be exposed:
			[*] /partition/upload
				After the upload is finished, the server should return the partition model.
			[*] /partition/scheme
				The client must forward the partition model and the schematic plan model.

	*/

	try{
		return ( function( config ){
			config = config || {};

			schemeType = config.schemeType || schemeType;
			partitionList = config.partitionList || partitionList;
			callback = config.callback || callback;
			config.callback = callback;

			if( !schemeType || !partitionList || !callback ){
				throw new Error( JSON.stringify( { error: "invalid parameters" } ) );
			}

			schemeType = schemeType.toLowerCase( );

			switch( schemeType ){
				case "dedicated-thread":

					break;
				case "dedicated-server":
					break;
			}
		} );
	}catch( error ){
		return ( ( callback && callback( error ) ) || error );	
	}
};

exports.partitionScheme = partitionScheme;
exports.partitionSpace = partitionSpace;
exports.reduceSpace = reduceSpace;