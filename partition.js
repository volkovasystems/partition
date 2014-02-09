/*:
	@include:
		{
			"nth-root": "nthRoot",
			"class-collection": "Collection"
		}
	@end-include
	
	@module-configuration:
		This module was once a crappy partition module.
		So I've reduced the codes to just focus on partitioning.

		The partition algorithm uses the Golden Ratio: 1.61803398875
			to be used as a root factor for dividing the space
			to partitions such that there will be a balance in 
			speed of processing and memory consumption.

					P = sqrt( N, GR );
		
		Where N is the total space and GR is the golden ratio.

		Where P is the partition factor that will be used
			to divide the space into smaller partitions.

					M = N / P 

		Where M is the minimum partitioned space.

		P now will become the number of processing loops that
			will go over the total space through the minimum
			partitioned space.

		This is only theoretical. Basically, partitioning a space
			requires a "factor" that will be used to divide the space
			or a "function" that will execute such kind of partitioning
			such that the resulting division will be used as means
			to balance processing speed and memory consumption.

		From this we can partially conclude that the "factor" is the 
			golden ratio and the "function" is finding the root
			of the number by using the golden ratio as the root factor.
	@end-module-configuration
*/
goldenRatio = 1.61803398875;

partition = function partition( space, callback ){
	/*:
		@meta-configuration:
			{
				"space:required": "object|number",
				"callback:optional": "Callback"
			}
		@end-meta-configuration

		@method-documentation:

		@end-method-documentation
	*/
	if( self.space.isNumber( ) ){
		var partitionFactor = Math.ceil( nthRoot( space, goldenRatio ) );
		var minimumSpace = Math.ceil( space / partitionFactor );
		return callback( null, {
			"partitionFactor": partitionFactor,
			"minimumSpace": minimumSpace
		} );
	}else{
		var currentCount = Collection( space ).getCurrentCount( );
		var partitionData = self.recall( currentCount );
		
	}
};
