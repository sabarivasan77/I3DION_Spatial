package com.example.storage

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first

class ProductRepository(private val productDao: ProductDao) {

    val allProducts: Flow<List<ProductEntity>> = productDao.getAllProducts()

    fun getProductsByCategory(category: String): Flow<List<ProductEntity>> {
        return productDao.getProductsByCategory(category)
    }

    fun getProductById(id: String): Flow<ProductEntity?> {
        return productDao.getProductById(id)
    }

    suspend fun getProductByIdOneShot(id: String): ProductEntity? {
        return productDao.getProductByIdOneShot(id)
    }

    suspend fun updateDownloadStatus(id: String, isDownloaded: Boolean, localPath: String?, fileSize: String, downloadDate: String) {
        productDao.updateDownloadStatus(id, isDownloaded, localPath, fileSize, downloadDate)
    }

    suspend fun updateFavoriteStatus(id: String, isFavorite: Boolean) {
        productDao.updateFavoriteStatus(id, isFavorite)
    }

    suspend fun insertSingleProduct(product: ProductEntity) {
        productDao.insertSingleProduct(product)
    }

    suspend fun seedProductsIfEmpty() {
        // Clear old seeds to ensure the new main-branch URLs and industrial names are updated
        productDao.deleteAll()
        
        val seedList = listOf(
            ProductEntity(
                id = "demo_cube",
                name = "Pre-Cached 3D Demo Cube",
                category = "Testing Equipment",
                description = "High-quality, pre-cached standard 3D spatial calibration cube. Located locally in application assets and preloaded for complete, zero-latency offline AR access and calibration testing.",
                imageResName = "img_compressor",
                modelUrl = "file:///android_asset/cube.glb",
                isDownloaded = true,
                localModelPath = null,
                specs = "Dimensions: 1.0x1.0x1.0 m|Weight: 1.0 kg|Mesh Geometry: 12 triangles|Material: Standard PBR diffuse map|Offline Cache Status: Pre-cached and ready",
                benefits = "Instantly accessible without any network connection|True 1-to-1 physical scale calibration tracking|Excellent base test model for checking surface placement stability|No drift or floating under standard tracking",
                documentName = "i3dion_cube_calibration_guide.pdf",
                isFavorite = true,
                fileSize = "1.6 KB",
                downloadDate = "Preloaded",
                isCustomQrScanned = false,
                thumbnailUrl = ""
            ),
            ProductEntity(
                id = "apex_100",
                name = "Apex-100 Industrial Compressor",
                category = "Air Compressors",
                description = "Heavy-duty industrial rotary screw air compressor designed for continuous operations, delivering maximum efficiency and superior air quality under extreme temperature conditions.",
                imageResName = "img_compressor",
                modelUrl = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/TwoCylinderEngine/glTF-Binary/TwoCylinderEngine.glb", // Real GLB download URL sample
                isDownloaded = false,
                localModelPath = null,
                specs = "Working Pressure: 8-10 bar|FAD Capacity: 12.8 m³/min|Motor Power Rating: 75 kW|Cooling Method: Air-Cooled Smart Fan|Dimensions: 1.85x1.20x1.60 m|Dry Weight: 1450 kg",
                benefits = "Energy Efficient (saves up to 35% power)|Integrated Cycle Air Dryer & Particle Filtration|Ultra-Quiet Operation (< 68 dBA noise shield)|IoT-Enabled Intelligent touch controller panel",
                documentName = "i3dion_apex100_datasheet.pdf",
                isFavorite = false,
                fileSize = "4.5 MB",
                downloadDate = ""
            ),
            ProductEntity(
                id = "titanflow_p",
                name = "CoreFlow Centrifugal Pump",
                category = "Pumps",
                description = "Sleek high-pressure centrifugal pump optimized for water treatment, industrial chemical processing, and agricultural irrigation with a durable stainless-steel structure.",
                imageResName = "img_pump",
                modelUrl = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb", // Real GLB download URL sample
                isDownloaded = false,
                localModelPath = null,
                specs = "Max Flow Rate: 250 m³/h|Rated Head: 85 meters|Motor Power: 45 kW|Operating Speed: 2900 RPM|Liquid Temperature: -15°C to +120°C",
                benefits = "Highly Corrosion Resistant SUS316|Precision Balanced Double-vane Impeller|Zero-Leakage Double Mechanical Seal|Low Vibrational Footprint",
                documentName = "i3dion_coreflow_pump_catalog.pdf",
                isFavorite = false,
                fileSize = "3.2 MB",
                downloadDate = ""
            ),
            ProductEntity(
                id = "megawatt_dynamo",
                name = "Titan-M Backup Generator",
                category = "Generators",
                description = "Enterprise-level 1200 kVA backup diesel generator housed in an ultra-silent soundproof acoustic enclosure. Perfect for hospital basements, data centers, and heavy plants.",
                imageResName = "img_generator",
                modelUrl = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb", // Real GLB download URL sample
                isDownloaded = false,
                localModelPath = null,
                specs = "Standby Rating: 1200 kVA / 960 kW|Voltage Output: 400V Three-Phase|Engine Style: Heavy-duty 12-Cylinder Diesel|Fuel Capacity: 1500 Liters",
                benefits = "Sub-10 Second Automatic Startup|Weather-Proof Sound Enclosure|Advanced Digital Synchronizer Sync-IV|High Load-Transient Tolerance",
                documentName = "i3dion_titanm_generator_specs.pdf",
                isFavorite = false,
                fileSize = "6.1 MB",
                downloadDate = ""
            ),
            ProductEntity(
                id = "forgeline_cnc",
                name = "ForgeLine 5-Axis Milling Machine",
                category = "Industrial Machinery",
                description = "Five-axis precision metal cutting machining center built with a high-torque spindle and advanced robotic tool changers for aerodynamic industrial component production.",
                imageResName = "img_compressor", // Fallback
                modelUrl = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/GearboxAssy/glTF-Binary/GearboxAssy.glb", // Real GLB download URL sample
                isDownloaded = false,
                localModelPath = null,
                specs = "Spindle Speed: 18,000 RPM|Travel Axes: X: 800 | Y: 700 | Z: 550 mm|Axis Angle Resolution: 0.001°|Tool Changer Capacity: 40 slots",
                benefits = "Nanometer-level Axis Repeatability|Thermo-symmetric Column Design|Custom Siemens 840D Controller|Complete Splash-Guard Enclosure",
                documentName = "i3dion_forgeline_cnc_manual.pdf",
                isFavorite = false,
                fileSize = "5.8 MB",
                downloadDate = ""
            ),
            ProductEntity(
                id = "syncbot_x",
                name = "SyncBot-X Collaborative Arm",
                category = "Automation Systems",
                description = "Six-axis multi-directional robotic arm designed for safe human collaboration in warehouse sorting, precision soldering, electronic testing, and product assembly.",
                imageResName = "img_pump", // Fallback
                modelUrl = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb", // Real GLB download URL sample
                isDownloaded = false,
                localModelPath = null,
                specs = "Reach Radius: 1300 mm|Payload Capacity: 15 kg|Joint Rotations: +/- 360° all joints|Repeatability Error: +/- 0.03 mm",
                benefits = "Dual Integrated Torque Force Sensors|Easy Hand-Guided Control Teaching|Instant Collision-stop Safe System|Lightweight space-saving mounting",
                documentName = "i3dion_syncbot_robotics_guide.pdf",
                isFavorite = false,
                fileSize = "7.4 MB",
                downloadDate = ""
            ),
            ProductEntity(
                id = "hydropure_fractionator",
                name = "HydroPure Molecular Column",
                category = "Process Equipment",
                description = "Advanced molecular fractionator and vacuum distillation column tower for separating high-purity chemical liquids under strictly monitored temperature profiles.",
                imageResName = "img_generator", // Fallback
                modelUrl = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb", // Real GLB download URL sample
                isDownloaded = false,
                localModelPath = null,
                specs = "Column Height: 12.4 meters|Vessel Diameter: 900 mm|Design Pressure: Full Vacuum to 16 barg|Heating Output: Ex-certified 150 kW",
                benefits = "High Molecular Distillation Yield|Automatic Vacuum Control System|Explosion-Proof ATEX/IECEx Rating|Teflon-Coated Internal Packings",
                documentName = "i3dion_hydropure_molecular_specs.pdf",
                isFavorite = false,
                fileSize = "11.2 MB",
                downloadDate = ""
            ),
            ProductEntity(
                id = "calibration_cube",
                name = "Spatial Calibration Cube",
                category = "Testing Equipment",
                description = "A standard 1x1x1 meter 3D calibration cube used for checking coordinate tracking, plane placement accuracy, shadow mapping, and real-world boundary scaling.",
                imageResName = "img_compressor", // Fallback
                modelUrl = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb", // Real GLB standard Box/Cube sample
                isDownloaded = false,
                localModelPath = null,
                specs = "Dimensions: 1.0x1.0x1.0 m|Weight: 10 kg|Material: Standard PBR Base Color|Mesh Geometry: 12 triangles|Textures: Untextured diffuse map",
                benefits = "Extremely fast loading (< 10 KB file size)|True 1-to-1 metric system scaling verification|Provides high-contrast plane alignment shadows|Useful for rapid test deployments",
                documentName = "i3dion_cube_calibration_guide.pdf",
                isFavorite = false,
                fileSize = "8 KB",
                downloadDate = ""
            )
        )
        productDao.insertProducts(seedList)
    }
}
