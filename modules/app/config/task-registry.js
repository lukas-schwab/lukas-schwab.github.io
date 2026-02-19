import { RegionLocatorController } from '../../controllers/region-locator.js';
import { LabelingController } from '../../controllers/labeling.js';
import { PropertyIdentifierController } from '../../controllers/property-identifier.js';
import { SimilarityLabelingController } from '../../controllers/similarity-labeling.js';

export const DUMMY_TASKS = {
    labeling: {
        type: 'labeling',
        isDummy: true,
        assets: {
            img: 'assets/dummy/label.png',
        }
    },
    image_region_locator: {
        type: 'image_region_locator',
        isDummy: true,
        assets: {
            imgA: 'assets/dummy/reference.png',
            imgB: 'assets/dummy/scheme.png'
        }
    },
    property_identifier: {
        type: 'property_identifier',
        isDummy: true,
        assets: {
            img: 'assets/dummy/identify.png',
        }
    },
    similarity_labeling: {
        type: 'similarity_labeling',
        isDummy: true,
        assets: {
            imgA: 'assets/dummy/left.png',
            imgB: 'assets/dummy/right.png',
        }
    }
};

export const taskControllers = {
    image_region_locator: { controller: RegionLocatorController, page: 'region-locator' },
    labeling: { controller: LabelingController, page: 'labeling' },
    property_identifier: { controller: PropertyIdentifierController, page: 'property-identifier' },
    similarity_labeling: { controller: SimilarityLabelingController, page: 'similarity-labeling' }
};
