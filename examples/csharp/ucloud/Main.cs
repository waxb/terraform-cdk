using System;
using System.Collections.Generic;
using System.Linq;
using ucloud;
using Constructs;
using HashiCorp.Cdktf;
using vsphere;



namespace MyCompany.MyApp
{
    class MyApp : TerraformStack
    {
        public MyApp(Construct scope, string id) : base(scope, id)
        {
            new UcloudProvider(this, "ucloud", new UcloudProviderConfig {
                Region = "cn-bj2",
                ProjectId = System.Environment.GetEnvironmentVariable("UCLOUD_PROJECT_ID") ?? "",
            });


        new VsphereProvider(this, "vsphere", new VsphereProviderConfig
        {
            User = "vsphereUser",
            Password = "vspherePassword",
            VsphereServer = "vsphereServer",
            AllowUnverifiedSsl = true,
        });


            DataUcloudImages images = new DataUcloudImages(this, "images", new DataUcloudImagesConfig {
	        AvailabilityZone = "cn-bj2-04",
                NameRegex        = "^CentOS 8.2 64",
                ImageType        = "base",	    
            });

	    new Instance(this, "web", new InstanceConfig {
                AvailabilityZone = "cn-bj2-04",
                ImageId = images.Images("0").Id,
                InstanceType = "n-basic-2",
                RootPassword = "wA1234567",
                Name = "cdktf-example-instance",
                Tag = "tf-example",
                BootDiskType = "cloud_ssd",
            });

            var ubuntuTemplate = new DataVsphereVirtualMachine(this, "ubuntu_template", new DataVsphereVirtualMachineConfig
                {
                    Name = "ubuntuTemplateName",
                    DatacenterId = "datacenter.Id",
                });

            new VirtualMachine(this, "name", new VirtualMachineConfig
            {
                Folder = "folder.Path",
                Name = "name",
                GuestId = ubuntuTemplate.GuestId,
                NumCpus = 42,
                NumCoresPerSocket = 23,
                Memory = 42,
                EnableDiskUuid = true,
                ResourcePoolId = "computeCluster.Id",
                DatastoreId = "datastore.Id",
                ScsiType = ubuntuTemplate.ScsiType,
                Disk = new[]
                {
                    new VirtualMachineDisk
                    {
                        UnitNumber = 0,
                        Label = "os",
                        Size = ubuntuTemplate.Disks("0").Size,
                        EagerlyScrub = ubuntuTemplate.Disks("0").EagerlyScrub,
                        ThinProvisioned = ubuntuTemplate.Disks("0").ThinProvisioned,
                    },
                    new VirtualMachineDisk
                    {
                        UnitNumber = 1,
                        Label = "data",
                        Size = 42,
                        EagerlyScrub = ubuntuTemplate.Disks("0").EagerlyScrub,
                        ThinProvisioned = ubuntuTemplate.Disks("0").ThinProvisioned,
                    },
                },
                NetworkInterface = new[]
                {
                    new VirtualMachineNetworkInterface
                    {
                        NetworkId = "network.Id",
                        AdapterType = "ubuntuTemplate.NetworkInterfaceTypes[0]",
                    },
                },
                Clone = new VirtualMachineClone
                    {
                        TemplateUuid = "ubuntuTemplate.Id",
                    },
                ExtraConfig = new Dictionary<string, string>
                {
                    {"guestinfo.userdata.encoding", "gzip+base64"},
                },
            });
        }

        public static void Main(string[] args)
        {
            App app = new App();
            new MyApp(app, "ucloud");
            app.Synth();
            Console.WriteLine("App synth complete");
        }
    }
}
